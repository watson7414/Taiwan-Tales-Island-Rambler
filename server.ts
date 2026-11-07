import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Server-side Gemini API endpoint for dynamic Ley-Line divination and urban legend rumors
  app.post('/api/divine-rumor', async (req, res) => {
    const { region, county, district, landmark, timeOfDay } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        source: 'local_archive',
        title: `【${district || '島嶼'}地脈靈波觀測記】`,
        content: `夜色深沉，${district || '此地'}靈脈深處傳來陣陣共鳴。相傳百年前封印於${landmark || '地脈裂隙'}的古老靈氣正悄然釋放，線香如絲雨繚繞。漫遊者請備好符咒與地圖，小心應對夜間異象。`,
        omen: '吉凶參半 · 地脈暗湧',
        recommendedStat: 'INT',
        statTip: '以智力破解古老符文，不可強行破陣。'
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `你是一名台灣都市怪談與靈能地脈秘術學者。請為桌上角色扮演遊戲《台灣異聞錄：島嶼漫遊者》生成一篇簡短、極具台灣在地氛圍與賽博民俗風格的「地脈感應異聞記錄」。
地點資訊：
- 地區：${region || '北部地區'}
- 縣市：${county || '台北市'}
- 鄉鎮市區：${district || '萬華區'}
- 代表地標：${landmark || '西門町夜市道場'}
- 時辰/氛圍：${timeOfDay || '深夜子時'}

請輸出嚴格的 JSON 格式（不要有任何 markdown 區塊或額外標籤），結構如下：
{
  "title": "短標題（例如：【西門夜壇鳴動記】）",
  "content": "約 80-120 字的在地民俗怪談、地脈異象或靈能觀測記錄，融合台灣道教民俗、都市傳說與賽博科技。",
  "omen": "四字吉凶卦象（如：大吉·靈光庇佑、小凶·幽冥霧鎖、大吉·地脈通達）",
  "recommendedStat": "STR、INT、AGI、LUK 其中之一",
  "statTip": "一句簡短的島嶼漫遊者行動叮嚀"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        source: 'gemini_oracle',
        ...parsed,
      });
    } catch (err: any) {
      console.error('Gemini Divination Error:', err?.message || err);
      return res.status(200).json({
        success: true,
        source: 'local_fallback',
        title: `【${district || '寶島'} · 古靈殘響】`,
        content: `地脈儀的八卦指針微微震顫，指向${landmark || '老城陰陽界'}深處。空氣中夾雜著潮濕泥土與宮廟檀香的味道，似乎有某種古老存在正在審視過往的旅人。`,
        omen: '中平 · 靜觀其變',
        recommendedStat: 'LUK',
        statTip: '凡事莫強求，順應機緣方能逢凶化吉。'
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
