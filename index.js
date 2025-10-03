// No external libraries needed due to environment issues. Using native Node.js fetch.

// --- Configuration ---
const SUPABASE_URL = 'https://quptneebcplnmzkyuxlu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dWd3cnVycWZyZWx4dHVydW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODE3MzQsImV4cCI6MjA3MTQ1NzczNH0.fG9ADswbAkXcPkMZEQkclxS5XjtAOrPtcRr81abXWi8';

/**
 * Fetches data from the Railway Station API.
 * @returns {Promise<Array>} A promise that resolves to an array of place objects.
 */
async function fetchFromAPI() {
    const apiUrl = 'https://api.railway-stations.org/photoStationsByCountry/th';
    console.log('Fetching data from Railway Station API for Thailand...');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();

        const photoBaseUrl = data.photoBaseUrl;
        const stations = data.stations || [];

        console.log(`Found ${stations.length} stations from the API.`);

        const formattedData = stations.map(station => {
            const imageUrl = station.photos && station.photos.length > 0
                ? `${photoBaseUrl}${station.photos[0].path}`
                : null;

            return {
                name: station.title,
                description: `สถานีรถไฟ ${station.title}`,
                province: 'N/A', // API does not provide province data
                type: 'สถานีรถไฟ',
                image_url: imageUrl,
                location: {
                    lat: station.lat,
                    lng: station.lon // Map lon to lng
                }
            };
        });

        return formattedData;
    } catch (error) {
        console.error('Error fetching from API:', error);
        return []; // Return empty array on error
    }
}

/**
 * Scrapes tourism data from specified websites.
 * (This function is disabled due to issues with external libraries in the environment)
 * @returns {Promise<Array>} A promise that resolves to an empty array.
 */
async function scrapeWebsites() {
    console.log('Skipping website scraping due to environment limitations.');
    return [];
}

/**
 * Saves an array of place data to the Supabase 'places' table using the REST API.
 * @param {Array<Object>} data - The array of place data to save.
 */
async function saveToSupabase(data) {
    if (!data || data.length === 0) {
        console.log('No data to save.');
        return;
    }

    const supabaseUrl = `${SUPABASE_URL}/rest/v1/places`;
    console.log(`Saving ${data.length} records to Supabase...`);

    try {
        const response = await fetch(supabaseUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal' // We don't need the data back
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Supabase API call failed with status: ${response.status}. Body: ${errorBody}`);
        }

        console.log('Data saved successfully to Supabase!');

    } catch (error) {
        console.error('Error saving data to Supabase:', error);
    }
}

/**
 * Main function to run the script.
 */
async function main() {
    console.log('Starting the data fetching process...');

    const apiData = await fetchFromAPI();
    const scrapedData = await scrapeWebsites();

    const allData = [...apiData, ...scrapedData];

    // Remove duplicates (optional, based on place name)
    const uniqueData = Array.from(new Map(allData.map(item => [item.name, item])).values());

    await saveToSupabase(uniqueData);

    console.log('Data fetching process completed.');
}

// --- Execution ---
// To run this script via a cron job, you would set up a command like:
// 0 1 * * * /usr/bin/node /path/to/your/project/index.js
// This example runs the script at 1:00 AM every day.

main().catch(error => console.error('An error occurred in the main process:', error));