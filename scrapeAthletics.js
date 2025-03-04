const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const scrapeAthleticsData = async () => {
    try {
        const siteURL = 'https://denverpioneers.com/index.aspx';
        const { data: htmlContent } = await axios.get(siteURL);
        const $ = cheerio.load(htmlContent);
        let eventScript = '';
        
        $('script').each((_, script) => {
            const content = $(script).html();
            if (content.includes('"type":"events"')) {
                eventScript = content;
            }
        });

        const jsonStart = eventScript.indexOf('{');
        const jsonEnd = eventScript.lastIndexOf('}') + 1;
        const eventJSON = JSON.parse(eventScript.substring(jsonStart, jsonEnd));
        
        const eventList = eventJSON.data.map(item => ({
            team: item.sport.title,
            opponent: item.opponent.name,
            date: new Date(item.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) + (item.time ? `, ${item.time}` : '')
        }));
        
        storeEvents({ events: eventList });
    } catch (err) {
        console.error('Data retrieval or processing failed:', err);
    }
};

const storeEvents = (eventData) => {
    fs.writeFile('results/athletic_events.json', JSON.stringify(eventData, null, 2), 'utf8', (error) => {
        if (error) {
            console.error('Error writing JSON file:', error);
        } else {
            console.log('Athletic event data saved successfully.');
        }
    });
};

scrapeAthleticsData();
