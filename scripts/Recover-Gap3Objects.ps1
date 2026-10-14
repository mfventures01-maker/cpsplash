[CmdletBinding()]
param(
    [string]$RepoRoot    = "C:\Projects\cp-splash",
    [string]$MigDir      = "supabase\migrations",
    [string]$EvidenceDir = "evidence\gap3"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root    = [System.IO.Path]::GetFullPath($RepoRoot)
$migRoot = Join-Path $root $MigDir
$evRoot  = Join-Path $root $EvidenceDir

function Load-Json {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing discovery file: $Path"
    }
    $raw = Get-Content -LiteralPath $Path -Raw
    # Defensive: strip <br> and unify escapes so on-disk state cannot break parsing.
    $raw = $raw -replace '<br\s*/?>', ''
    $raw = $raw -replace '\\u0027', "'"
    $raw = $raw -replace '\\u0022', '"'
    $idx = $raw.IndexOf('{')
    if ($idx -gt 0) { $raw = $raw.Substring($idx) }
    return ($raw | ConvertFrom-Json)
}

$d1 = Load-Json (Join-Path $evRoot "gap3-discovery.json")
$d2 = Load-Json (Join-Path $evRoot "gap3-discovery-extended.json")

$RECOVERY_DATE = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")

function Migration-Header {
    param([string]$ObjectName, [string]$ObjectKind)
    return @"
-- =============================================================================
-- RECOVERED FROM LIVE CATALOG, NOT LEDGER
-- =============================================================================
-- Object:      $ObjectName ($ObjectKind)
-- Recovered:   $RECOVERY_DATE
-- Source:      Production Supabase project - information_schema / pg_catalog dump
-- Evidence:    A_STATIC - reconstructed from live database catalog, not from
--              supabase_migrations.schema_migrations
-- Status:      Documentation artifact. The object ALREADY EXISTS in production.
--              DO NOT APPLY as a new migration.
-- Purpose:     Close the migration-directory lineage gap so every object in
--              the live database is traceable to a file in the repository.
-- =============================================================================

"@
}

function SqlType {
    param([string]$Udt, $Precision, $Scale)
    switch ($Udt) {
        'uuid'        { 'uuid' }
        'text'        { 'text' }
        'bool'        { 'boolean' }
        'int4'        { 'integer' }
        'int8'        { 'bigint' }
        'jsonb'       { 'jsonb' }
        'timestamptz' { 'timestamptz' }
        'date'        { 'date' }
        'numeric' {
            if ($null -ne $Precision -and $null -ne $Scale) { "numeric($Precision,$Scale)" }
            elseif ($null -ne $Precision) { "numeric($Precision)" }
            else { 'numeric' }
        }
        default { $Udt }
    }
}

function Emit-Table {
    param(
        [string]$TableName,
        [array]$Columns,
        [array]$Constraints,
        [array]$Indexes,
        [array]$Triggers,
        [array]$RlsPolicies
    )

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine((Migration-Header -ObjectName $TableName -ObjectKind "table"))
    [void]$sb.AppendLine("CREATE TABLE public.$TableName (")

    $colLines = @()
    foreach ($c in ($Columns | Sort-Object ordinal_position)) {
        $t    = SqlType -Udt $c.udt_name -Precision $c.numeric_precision -Scale $c.numeric_scale
        $line = "  $($c.column_name) $t"
        if (-not [string]::IsNullOrWhiteSpace($c.column_default)) {
            $line += " DEFAULT $($c.column_default)"
        }
        if ($c.is_nullable -eq 'NO') {
            $line += " NOT NULL"
        }
        $colLines += $line
    }
    [void]$sb.AppendLine(($colLines -join ",`r`n"))
    [void]$sb.AppendLine(");")
    [void]$sb.AppendLine("")

    foreach ($k in $Constraints) {
        [void]$sb.AppendLine("ALTER TABLE public.$TableName ADD CONSTRAINT $($k.constraint_name) $($k.definition);")
    }
    [void]$sb.AppendLine("")

    foreach ($ix in $Indexes) {
        if ($ix.is_primary) { continue }
        [void]$sb.AppendLine("$($ix.definition);")
    }
    [void]$sb.AppendLine("")

    [void]$sb.AppendLine("ALTER TABLE public.$TableName ENABLE ROW LEVEL SECURITY;")
    foreach ($p in $RlsPolicies) {
        if ($p.table_name -ne $TableName) { continue }
        $cmdMap = @{ 'r'='SELECT'; 'a'='INSERT'; 'w'='UPDATE'; 'd'='DELETE'; '*'='ALL' }
        $cmd = $cmdMap[$p.policy_cmd]
        if (-not $cmd) { throw "Unknown policy_cmd '$($p.policy_cmd)' on $TableName.$($p.policy_name)" }

        $roles = ($p.roles -join ", ")
        [void]$sb.AppendLine("DROP POLICY IF EXISTS `"$($p.policy_name)`" ON public.$TableName;")
        [void]$sb.AppendLine("CREATE POLICY `"$($p.policy_name)`" ON public.$TableName")
        [void]$sb.AppendLine("  FOR $cmd TO $roles")
        if ($p.using_expr)      { [void]$sb.AppendLine("  USING ($($p.using_expr))") }
        if ($p.with_check_expr) { [void]$sb.AppendLine("  WITH CHECK ($($p.with_check_expr))") }
        [void]$sb.AppendLine(";")
        [void]$sb.AppendLine("")
    }

    foreach ($t in $Triggers) {
        if ($t.table_name -ne $TableName) { continue }
        [void]$sb.AppendLine("DROP TRIGGER IF EXISTS $($t.trigger_name) ON public.$TableName;")
        [void]$sb.AppendLine("$($t.definition);")
        [void]$sb.AppendLine("")
    }

    return $sb.ToString()
}

function Emit-Function {
    param([object]$Fn)
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine((Migration-Header -ObjectName $Fn.function_name -ObjectKind "function"))
    [void]$sb.AppendLine($Fn.definition)
    return $sb.ToString()
}

function Emit-Sequence {
    param([object]$Seq)
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine((Migration-Header -ObjectName $Seq.sequence_name -ObjectKind "sequence"))
    [void]$sb.AppendLine("CREATE SEQUENCE IF NOT EXISTS public.$($Seq.sequence_name)")
    [void]$sb.AppendLine("  AS bigint")
    [void]$sb.AppendLine("  INCREMENT BY $($Seq.seqincrement)")
    [void]$sb.AppendLine("  MINVALUE $($Seq.seqmin)")
    [void]$sb.AppendLine("  MAXVALUE $($Seq.seqmax)")
    [void]$sb.AppendLine("  START WITH $($Seq.seqstart)")
    [void]$sb.AppendLine("  CACHE $($Seq.seqcache)")
    if ($Seq.seqcycle) { [void]$sb.AppendLine("  CYCLE") } else { [void]$sb.AppendLine("  NO CYCLE") }
    [void]$sb.AppendLine(";")
    return $sb.ToString()
}

function Table-Cols     { param($D, $T) @($D.tables      | Where-Object { $_.table_name -eq $T }) }
function Table-Cons     { param($D, $T) @($D.constraints | Where-Object { $_.table_name -eq $T }) }
function Table-Indexes  { param($D, $T) @($D.indexes     | Where-Object { $_.table_name -eq $T }) }
function Table-Triggers { param($D, $T) @($D.triggers    | Where-Object { $_.table_name -eq $T }) }
function Table-Rls      { param($D, $T) @($D.rls         | Where-Object { $_.table_name -eq $T }) }

$fnTouch = $d2.functions | Where-Object { $_.function_name -eq 'touch_sales_updated_at' }
$fnNorm  = $d2.functions | Where-Object { $_.function_name -eq 'normalize_sales_lead' }
$seqLead = $d1.sequences | Where-Object { $_.sequence_name -eq 'sales_lead_number_seq' } | Select-Object -First 1

$files = @()

$files += @{ Name = '20261015_000001_recovered_touch_sales_updated_at_fn.sql'; Content = (Emit-Function -Fn $fnTouch) }
$files += @{ Name = '20261015_000002_recovered_normalize_sales_lead_fn.sql';  Content = (Emit-Function -Fn $fnNorm)  }
$files += @{ Name = '20261015_000003_recovered_sales_lead_number_seq.sql';    Content = (Emit-Sequence -Seq $seqLead) }

$files += @{ Name = '20261015_000004_recovered_sales_territories.sql'; Content = (Emit-Table -TableName 'sales_territories' `
    -Columns     (Table-Cols     $d2 'sales_territories') `
    -Constraints (Table-Cons     $d2 'sales_territories') `
    -Indexes     (Table-Indexes  $d2 'sales_territories') `
    -Triggers    (Table-Triggers $d2 'sales_territories') `
    -RlsPolicies (Table-Rls      $d2 'sales_territories')) }

$files += @{ Name = '20261015_000005_recovered_sales_offers.sql'; Content = (Emit-Table -TableName 'sales_offers' `
    -Columns     (Table-Cols     $d2 'sales_offers') `
    -Constraints (Table-Cons     $d2 'sales_offers') `
    -Indexes     (Table-Indexes  $d2 'sales_offers') `
    -Triggers    (Table-Triggers $d2 'sales_offers') `
    -RlsPolicies (Table-Rls      $d2 'sales_offers')) }

$files += @{ Name = '20261015_000006_recovered_sales_journeys.sql'; Content = (Emit-Table -TableName 'sales_journeys' `
    -Columns     (Table-Cols     $d1 'sales_journeys') `
    -Constraints (Table-Cons     $d1 'sales_journeys') `
    -Indexes     (Table-Indexes  $d1 'sales_journeys') `
    -Triggers    (Table-Triggers $d1 'sales_journeys') `
    -RlsPolicies (Table-Rls      $d1 'sales_journeys')) }

$files += @{ Name = '20261015_000007_recovered_sales_leads.sql'; Content = (Emit-Table -TableName 'sales_leads' `
    -Columns     (Table-Cols     $d1 'sales_leads') `
    -Constraints (Table-Cons     $d1 'sales_leads') `
    -Indexes     (Table-Indexes  $d1 'sales_leads') `
    -Triggers    (Table-Triggers $d1 'sales_leads') `
    -RlsPolicies (Table-Rls      $d1 'sales_leads')) }

New-Item -ItemType Directory -Path $migRoot -Force | Out-Null
New-Item -ItemType Directory -Path $evRoot  -Force | Out-Null

foreach ($f in $files) {
    $dest = Join-Path $migRoot $f.Name
    if (Test-Path -LiteralPath $dest) {
        throw "Refusing to overwrite existing file: $dest"
    }
}

$manifest = @()
foreach ($f in $files) {
    $dest = Join-Path $migRoot $f.Name
    [System.IO.File]::WriteAllText($dest, $f.Content, [System.Text.UTF8Encoding]::new($false))

    $hash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
    $manifest += [pscustomobject]@{
        file           = $f.Name
        sha256         = $hash
        bytes          = (Get-Item $dest).Length
        evidence_class = "A_STATIC"
        source         = "LIVE_CATALOG_DUMP"
        applied_to_db  = $false
    }
    Write-Host ("[WROTE] {0}  ({1} bytes)" -f $f.Name, (Get-Item $dest).Length)
}

$manifestPath = Join-Path $evRoot "gap3-recovery-manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$hashPath = Join-Path $evRoot "gap3-recovery-sha256.txt"
$manifest | ForEach-Object { "$($_.sha256)  $($_.file)" } |
    Set-Content -LiteralPath $hashPath -Encoding UTF8

Write-Host ""
Write-Host "GAP-3 RECOVERY COMPLETE" -ForegroundColor Green
Write-Host "Files written: $($manifest.Count)"
Write-Host "MigDir:        $migRoot"
Write-Host "Manifest:      $manifestPath"
Write-Host "SHA-256 list:  $hashPath"
Write-Host "Database:      NONE"
Write-Host "Git commits:   NONE"
