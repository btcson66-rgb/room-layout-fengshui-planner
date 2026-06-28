export type FengShuiRule = {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  traditionalReason: string;
  practicalReason: string;
  recommendation: string;
  relatedArticleSlug: string;
};

export const fengShuiRules: FengShuiRule[] = [
  {
    "id": "bed-facing-door",
    "title": "床不要正對門",
    "category": "bed",
    "severity": "high",
    "traditionalReason": "傳統民俗常稱床對門為門沖，睡眠區不宜直接承受門口視線與氣流。",
    "practicalReason": "門口帶來光線、聲音與人員進出，容易干擾睡眠與安全感。",
    "recommendation": "優先調整到斜對門位置；若不能移床，可用矮櫃、屏風、門簾或地毯建立緩衝。",
    "relatedArticleSlug": "bed-facing-door-feng-shui"
  },
  {
    "id": "mirror-facing-bed",
    "title": "鏡子不要正對床",
    "category": "mirror",
    "severity": "medium",
    "traditionalReason": "民俗上認為鏡子對床容易影響安定感。",
    "practicalReason": "夜間反射人影、車燈或手機光，可能造成視覺刺激。",
    "recommendation": "將鏡子移到床側、衣櫃內側或門後；不能移動時，睡覺時用布簾遮住。",
    "relatedArticleSlug": "mirror-facing-bed-bedroom"
  },
  {
    "id": "headboard-wall",
    "title": "床頭最好靠實牆",
    "category": "bed",
    "severity": "high",
    "traditionalReason": "床頭有靠象徵穩定。",
    "practicalReason": "床頭靠牆可降低背後空曠感，也減少窗邊噪音、溫差與走道干擾。",
    "recommendation": "優先選完整牆面；若不能靠牆，可用床頭板、矮櫃或厚靠墊建立穩定背景。",
    "relatedArticleSlug": "bed-head-against-wall"
  },
  {
    "id": "bed-under-window",
    "title": "床頭避免直接靠窗",
    "category": "window",
    "severity": "medium",
    "traditionalReason": "窗戶是光線與氣流進出位置，民俗上常視為不穩。",
    "practicalReason": "窗邊容易有光線、噪音、溫差、濕氣。",
    "recommendation": "使用遮光窗簾、床頭板，讓床與窗保持距離並檢查漏風潮濕。",
    "relatedArticleSlug": "bed-under-window-solutions"
  },
  {
    "id": "desk-facing-door",
    "title": "書桌可看見門但不要正沖門",
    "category": "desk",
    "severity": "medium",
    "traditionalReason": "書桌重視背後有靠與前方穩定。",
    "practicalReason": "背對門容易被嚇到，正對門則容易被走道干擾。",
    "recommendation": "把書桌放在側牆或斜對門位置，背後用牆、櫃或高背椅增加支撐。",
    "relatedArticleSlug": "desk-facing-door-layout"
  },
  {
    "id": "clear-entry",
    "title": "入口與主要走道保持乾淨",
    "category": "circulation",
    "severity": "high",
    "traditionalReason": "民俗上重視氣流順暢。",
    "practicalReason": "門口、床邊、衣櫃前堵住會讓生活動作卡住，也讓房間容易亂。",
    "recommendation": "清出入口、床邊、桌前、衣櫃前四個高頻動線區。",
    "relatedArticleSlug": "room-circulation-width-guide"
  }
];
