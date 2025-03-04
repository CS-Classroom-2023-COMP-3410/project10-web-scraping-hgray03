const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const url = 'https://bulletin.du.edu/undergraduate/majorsminorscoursedescriptions/traditionalbachelorsprogrammajorandminors/computerscience/#coursedescriptionstext';

axios.get(url)
    .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        const courses = [];

        $('.courseblock').each((index, element) => {
            const titleText = $(element).find('.courseblocktitle').text().trim();
            const [courseCode, ...titleParts] = titleText.split(' ');
            const title = titleParts.join(' ').trim();

            // Extract course number and check if it's 3000-level or higher
            const courseNumberMatch = courseCode.match(/\d{4}/);
            if (courseNumberMatch) {
                const courseNumber = parseInt(courseNumberMatch[0], 10);
                if (courseNumber >= 3000) {
                    const descriptionText = $(element).find('.courseblockdesc').text().trim();
                    if (!/Prerequisite/i.test(descriptionText)) { // Exclude courses with prerequisites
                        courses.push({
                            course: courseCode,
                            title: title
                        });
                    }
                }
            }
        });

        // Ensure the results directory exists
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Write the filtered data to bulletin.json
        fs.writeFile(path.join(resultsDir, 'bulletin.json'), JSON.stringify({ courses }, null, 4), (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Filtered data successfully written to results/bulletin.json');
            }
        });
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
