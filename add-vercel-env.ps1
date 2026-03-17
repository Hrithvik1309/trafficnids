# PowerShell script to add environment variables to Vercel
# Run this after installing Vercel CLI: npm i -g vercel

Write-Host "Adding environment variables to Vercel..." -ForegroundColor Green

# AbuseIPDB
echo "b488083b773bcbba82eefb5964d2529dc9dd37cfc95c8990bcf767018b67d7f527d0a3e050509c9e" | vercel env add ABUSEIPDB_API_KEY production
echo "b488083b773bcbba82eefb5964d2529dc9dd37cfc95c8990bcf767018b67d7f527d0a3e050509c9e" | vercel env add ABUSEIPDB_API_KEY preview
echo "b488083b773bcbba82eefb5964d2529dc9dd37cfc95c8990bcf767018b67d7f527d0a3e050509c9e" | vercel env add ABUSEIPDB_API_KEY development

# Firebase
echo "AIzaSyA7sjgvUsVSuy5PHUN2l9P-wD8cgs2FLjo" | vercel env add FIREBASE_API_KEY production
echo "AIzaSyA7sjgvUsVSuy5PHUN2l9P-wD8cgs2FLjo" | vercel env add FIREBASE_API_KEY preview
echo "AIzaSyA7sjgvUsVSuy5PHUN2l9P-wD8cgs2FLjo" | vercel env add FIREBASE_API_KEY development

echo "trafficred-df988.firebaseapp.com" | vercel env add FIREBASE_AUTH_DOMAIN production
echo "trafficred-df988.firebaseapp.com" | vercel env add FIREBASE_AUTH_DOMAIN preview
echo "trafficred-df988.firebaseapp.com" | vercel env add FIREBASE_AUTH_DOMAIN development

echo "trafficred-df988" | vercel env add FIREBASE_PROJECT_ID production
echo "trafficred-df988" | vercel env add FIREBASE_PROJECT_ID preview
echo "trafficred-df988" | vercel env add FIREBASE_PROJECT_ID development

echo "trafficred-df988.firebasestorage.app" | vercel env add FIREBASE_STORAGE_BUCKET production
echo "trafficred-df988.firebasestorage.app" | vercel env add FIREBASE_STORAGE_BUCKET preview
echo "trafficred-df988.firebasestorage.app" | vercel env add FIREBASE_STORAGE_BUCKET development

echo "349919199118" | vercel env add FIREBASE_MESSAGING_SENDER_ID production
echo "349919199118" | vercel env add FIREBASE_MESSAGING_SENDER_ID preview
echo "349919199118" | vercel env add FIREBASE_MESSAGING_SENDER_ID development

echo "1:349919199118:web:0236963a512dc4717caedf" | vercel env add FIREBASE_APP_ID production
echo "1:349919199118:web:0236963a512dc4717caedf" | vercel env add FIREBASE_APP_ID preview
echo "1:349919199118:web:0236963a512dc4717caedf" | vercel env add FIREBASE_APP_ID development

Write-Host "`nDone! Now redeploy your project with: vercel --prod" -ForegroundColor Green
