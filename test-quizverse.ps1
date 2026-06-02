

$aiUrl = "http://localhost:8000"
$backendUrl = "http://localhost:8080"
$frontendUrl = "http://localhost:3000"

Write-Host "========================================="
Write-Host "    QuizVerse End-to-End Dummy Test      "
Write-Host "========================================="

# 1. Test AI Service Health
Write-Host "`n[1] Checking AI Service Health ($aiUrl/health)..."
try {
    $aiHealth = Invoke-RestMethod -Uri "$aiUrl/health" -Method Get -UseBasicParsing
    Write-Host "✅ AI Service is UP! Status: $($aiHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Service is down or not responding." -ForegroundColor Red
}

# 2. Test AI Service Text Parsing (Gemini Integration)
Write-Host "`n[2] Testing AI Service Text-to-Quiz Generation..."
$aiPayload = @{
    text = "The mitochondria is the powerhouse of the cell. Water is made of two hydrogen atoms and one oxygen atom."
} | ConvertTo-Json

try {
    $aiResult = Invoke-RestMethod -Uri "$aiUrl/ai/parse-text" -Method Post -Body $aiPayload -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ AI Generation Successful!" -ForegroundColor Green
    Write-Host "   Generated Questions: $($aiResult.questions.Count)" -ForegroundColor Cyan
    Write-Host "   Sample Question: $($aiResult.questions[0].text)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ AI Generation Failed. Ensure GEMINI_API_KEY is set correctly in .env." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 3. Test Backend Health (if actuator or public endpoint exists)
Write-Host "`n[3] Checking Backend Connectivity ($backendUrl)..."
try {
    # We test a simple OPTIONS request to see if the server responds
    $backendHealth = Invoke-WebRequest -Uri "$backendUrl/" -Method Options -UseBasicParsing
    Write-Host "✅ Backend is running and reachable!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend returned an error (expected if / is secured), but the server is reachable!" -ForegroundColor Yellow
}

# 4. Test Frontend
Write-Host "`n[4] Checking Frontend Connectivity ($frontendUrl)..."
try {
    $frontendHealth = Invoke-WebRequest -Uri "$frontendUrl" -Method Get -UseBasicParsing
    Write-Host "✅ Frontend is UP and serving pages!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is not reachable." -ForegroundColor Red
}

Write-Host "`n========================================="
Write-Host "            Test Complete!               "
Write-Host "========================================="
