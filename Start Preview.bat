@echo off
setlocal
set "PREVIEW_URL=http://127.0.0.1:5174/"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$url = '%PREVIEW_URL%'; try { $response = Invoke-WebRequest -Uri $url -TimeoutSec 2; if ($response.StatusCode -ne 200) { throw 'Preview is not responding' } } catch { Start-Process -FilePath 'node.exe' -ArgumentList 'preview-server.cjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden; Start-Sleep -Seconds 2 }; Start-Process $url"

endlocal
