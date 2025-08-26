# 🗺️ Google Maps Integration Setup Guide

This guide will help you integrate Google Maps into your Bella Vista Restaurant website.

## 📋 **Prerequisites**

- Google account
- Credit card (for billing verification - Google provides $200 monthly credit)

## 🔑 **Step 1: Get Google Maps API Key**

### 1.1 Go to Google Cloud Console
- Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
- Sign in with your Google account

### 1.2 Create a New Project
- Click on the project dropdown at the top
- Click "New Project"
- Name it: `Bella Vista Restaurant`
- Click "Create"

### 1.3 Enable Required APIs
- Go to "APIs & Services" > "Library"
- Search for and enable these APIs:
  - **Maps JavaScript API** - For interactive maps
  - **Geocoding API** - For address conversion
  - **Places API** - For location search (optional)

### 1.4 Create API Key
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "API Key"
- Copy your API key (it will look like: `AIzaSyB...`)

### 1.5 Restrict API Key (Security)
- Click on your API key
- Under "Application restrictions" select "HTTP referrers (web sites)"
- Add your domain: `localhost:3000/*` (for development)
- Under "API restrictions" select "Restrict key"
- Select the APIs you enabled above
- Click "Save"

## ⚙️ **Step 2: Configure Environment Variables**

### 2.1 Environment File Setup
The new Docker setup automatically manages environment files:

```bash
# Option 1: Use automated setup (Recommended)
./setup.sh

# Option 2: Manual setup
cp frontend/.env.example frontend/.env.local
```

### 2.2 Add Your API Key
Edit `frontend/.env.local`:
```env
# Google Maps API Key (Required for maps functionality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...your_actual_api_key_here

# Other frontend environment variables are already configured
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3003/api/admin
```

### 2.3 Security Note
The Google Maps API key is automatically protected by the improved `.gitignore` setup - it will never be committed to version control.

## 🚀 **Step 3: Test the Integration**

### 3.1 Start/Restart Services
```bash
# Option 1: Use automated setup
./setup.sh

# Option 2: Manual restart
docker-compose restart frontend

# Option 3: Full restart
docker-compose down && docker-compose up -d
```

### 3.2 Visit the Contact Page
- Go to: `http://localhost:3000/contact`
- Scroll down to "📍 Cómo Llegar"
- You should see an interactive Google Map!

### 3.3 Check Service Status
```bash
# Verify all services are healthy
docker-compose ps

# View frontend logs if issues
docker-compose logs frontend
```

## 🎯 **Features Included**

✅ **Interactive Map** - Zoom, pan, street view
✅ **Custom Marker** - Bella Vista branded location pin
✅ **Info Window** - Restaurant details on click
✅ **Address Geocoding** - Automatically finds coordinates
✅ **Responsive Design** - Works on all devices
✅ **Custom Styling** - Matches your brand colors

## 💰 **Costs & Limits**

### Free Tier (Monthly):
- **$200 credit** - Usually sufficient for small businesses
- **28,500 map loads** - Maps displayed to users
- **2,500 geocoding requests** - Address lookups

### Typical Usage (Small Restaurant):
- **~100 map views/day** = ~3,000/month
- **~50 address lookups/day** = ~1,500/month
- **Estimated cost**: $0-5/month (well within free tier)

## 🔧 **Customization Options**

### Map Styling
Edit `frontend/components/GoogleMap.js`:
```javascript
// Custom map colors
styles: [
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  }
]
```

### Marker Icon
Replace the SVG in the component with your own logo:
```javascript
icon: {
  url: 'your-custom-marker.png',
  scaledSize: new window.google.maps.Size(32, 32)
}
```

### Address
Change the restaurant address:
```javascript
<GoogleMap 
  address="Your New Address, City, Country"
  zoom={16}
/>
```

## 🚨 **Troubleshooting**

### Map Not Loading
- **Check API key in `.env.local`**
- **Verify API is enabled in Google Cloud Console**
- **Check browser console for errors**
- **Restart frontend service:** `docker-compose restart frontend`
- **Check service health:** `docker-compose ps`
- **Try automated setup:** `./setup.sh` to reset everything

### "Failed to load Google Maps"
- API key is invalid or restricted
- Billing not set up
- API quota exceeded

### Address Not Found
- Check address format
- Verify Geocoding API is enabled
- Try different address variations

## 📱 **Mobile Optimization**

The map is already mobile-optimized with:
- Touch-friendly controls
- Responsive sizing
- Mobile-optimized zoom levels
- Fast loading on mobile networks

## 🔒 **Security Best Practices**

✅ **Restrict API key** to your domain only
✅ **Enable billing alerts** in Google Cloud Console
✅ **Monitor usage** regularly
✅ **Use environment variables** (never commit API keys to Git)

## 📞 **Support**

If you encounter issues:
1. Check browser console for errors
2. Verify API key configuration
3. Check Google Cloud Console billing
4. Review this setup guide

---

**🎉 Congratulations!** Your restaurant now has a professional, interactive map that will help customers find you easily!
