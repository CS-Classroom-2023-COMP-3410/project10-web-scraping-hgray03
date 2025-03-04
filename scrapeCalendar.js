const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const calendarUrl = 'https://www.du.edu/calendar?search=&start_date=2025-01-01&end_date=2025-12-31#events-listing-date-filter';

const getEvents = async () => {
    try {
        const response = await axios.get(calendarUrl);
        const $ = cheerio.load(response.data);
        const eventList = [];

        $('.event-card').each((_, elem) => {
            const link = $(elem).attr('href');
            const eventUrl = link.startsWith('http') ? link : `${calendarUrl}${link.startsWith('/') ? '' : '/'}${link}`;
            const eventDate = $(elem).find('p').eq(0).text().trim();
            const eventTitle = $(elem).find('h3').text().trim();
            const eventTime = $(elem).find('span.icon-du-clock').parent().text().trim();

            const eventData = { title: eventTitle, date: eventDate };
            if (eventTime) eventData.time = eventTime;
            eventList.push({ ...eventData, url: eventUrl });
        });

        for (const event of eventList) {
            try {
                const detailRes = await axios.get(event.url);
                const detailPage = cheerio.load(detailRes.data);
                const eventDescription = detailPage('.description').text().trim().replace(/\s\s+/g, ' ');
                if (eventDescription) event.description = eventDescription;
                delete event.url;
            } catch (err) {
                console.error(`Failed to retrieve details for ${event.url}:`, err);
            }
        }

        return eventList;
    } catch (err) {
        console.error('Error fetching events:', err);
        return [];
    }
};

const storeEvents = async (events) => {
    const dir = 'results';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/calendar_events.json`, JSON.stringify({ events }, null, 2), 'utf8');
    console.log('Events stored in results/calendar_events.json');
};

(async () => {
    const eventsData = await getEvents();
    await storeEvents(eventsData);
})();
