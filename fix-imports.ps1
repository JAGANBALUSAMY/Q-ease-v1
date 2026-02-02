$files = Get-ChildItem -Path "frontend\src\features" -Recurse -Filter "*.jsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content
    
    # Fix imports for files in features/[feature]/pages/ (3 levels deep)
    if ($file.DirectoryName -like "*\pages") {
        # Change ../../ to ../../../ for contexts, services, utils, hooks, store
        $updated = $updated -replace "from ['""]\.\.\/\.\.\/(contexts|services|utils|hooks|store)/", "from '../../../`$1/"
        # Change ../ to ../../../ for contexts, services, utils, hooks, store (for RegisterPage.jsx)
        $updated = $updated -replace "from ['""]\.\.\/(contexts|services|utils|hooks|store)/", "from '../../../`$1/"
    }
    
    # Fix imports for files in features/[feature]/components/ (3 levels deep)
    if ($file.DirectoryName -like "*\components") {
        # Change ../../ to ../../../ for contexts, services, utils, hooks, store
        $updated = $updated -replace "from ['""]\.\.\/\.\.\/(contexts|services|utils|hooks|store)/", "from '../../../`$1/"
    }
    
    if ($content -ne $updated) {
        Set-Content $file.FullName -Value $updated -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "All imports fixed!"
