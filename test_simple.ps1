Write-Host "Testing API endpoint..."

try {
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    $body = '{"prompt":"test warrior"}'
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/generateGame" -Method POST -Headers $headers -Body $body
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API call successful"
        
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "Game Setting: $($data.game_data.setting)"
        Write-Host "Protagonist: $($data.game_data.protagonist_role)"
        
        if ($data.game_data.images) {
            Write-Host "Images generated:"
            Write-Host "  Avatar: $($data.game_data.images.avatar)"
            Write-Host "  Background: $($data.game_data.images.background)"
            Write-Host "  NPC: $($data.game_data.images.npc)"
            
            # Check if the avatar file exists
            if ($data.game_data.images.avatar) {
                $avatarFile = "client/public/$($data.game_data.images.avatar)"
                if (Test-Path $avatarFile) {
                    Write-Host "✅ Avatar image file exists: $avatarFile"
                } else {
                    Write-Host "❌ Avatar image file missing: $avatarFile"
                }
            }
        } else {
            Write-Host "❌ No images in response"
        }
    } else {
        Write-Host "❌ API call failed with status: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
} 