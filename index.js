
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const P_PREFIX = 'PL'
const O_PREFIX = 'OPL';
const { TARGET } = require(`${process.cwd()}/config.json`);

const P_URL = (year) => `http://www.nfd.com.tw/lottery/power-38/${year}.htm`;
const O_URL = (year) => `http://www.nfd.com.tw/lottery/power-38/f${year}.htm`;

const PATH = {
    [P_PREFIX]: P_URL,
    [O_PREFIX]: O_URL,
}
async function crawlData(prefix, year) {
    const url = PATH[prefix];
    const response = await axios.get(url(year));
    //console.log("response data", response.data);
    const $ = cheerio.load(response.data);

    // 爬取所有的球號
    const numbers = [];
    for (let i = 1; i <= 7; i++) {
        const nums = [];
        //console.log("$", $(`table td:contains(球號 ${i})`).nextAll())
        $('table tr').nextAll().each((index, element) => {


            let date = $(element).find('td:nth-child(2)').text().replace(/^\s+|\s+/, "")
            nums.push({
                date,
                number: $(element).find(`td:nth-child(${i + 3})`).text().trim()
            })
        })
        numbers.push(nums);

    }
    //console.debug("numbers", numbers)

    // 將資料寫入檔案
    for (let i = 0; i < numbers.length; i++) {
        const fileName = `${prefix}_${i + 1}.txt`;
        const item = numbers[i]
        for (const { date, number } of item) {
            const data = `${year}/${date}, ${number}\n`;
            fs.appendFileSync(`${TARGET}/${fileName}`, data);
        }

        console.log(`${year} 檔案已輸出至 ${fileName}`);
    }
}

// 從 2008 年到現在的年份逐一爬取
async function seqtimePromises(timeseries, prefix) {
    for (let year of timeseries) {
        await crawlData(prefix, year)
    }
}
(async () => {
    // 刪除目標檔案
    console.log("刪除目標檔案")
    for (let i = 0; i < 7; i++) {
        for (const prefix in PATH) {
            const filepath = `${TARGET}/${prefix}_${i + 1}.txt`
            if (fs.existsSync(filepath))
                fs.unlinkSync(filepath)
        }

    }
    console.log("開始執行爬蟲")

    const timeseries = [];
    for (let year = 2008; year <= new Date().getFullYear(); year++) {
        timeseries.push(year);
    }

    await Promise.allSettled([
        seqtimePromises(timeseries, P_PREFIX),
        seqtimePromises(timeseries, O_PREFIX)
    ])

    console.log("Done")
})()






