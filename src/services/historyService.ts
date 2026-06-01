const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

export interface HistoryRecord {
  timestamp: string;
  inspectorName: string;
  extinguisherNo: string;
  extinguisherCode: string;
  locationName: string;
  typeName: string;
  driveFolderId: string;
  tankCondition: string;
  hoseCondition: string;
  pressureGauge: string;
  noObstruction: string;
  sealCondition: string;
  labelVisible: string;
  result: string;
  remark: string;
  photoUrls: string;
}

export interface ExtGroup {
  extinguisherNo: string;
  extinguisherCode: string;
  locationName: string;
  typeName: string;
  count: number;
  lastResult: string;
  lastTimestamp: string;
  lastInspector: string;
  records: HistoryRecord[];
}

export interface NotInspectedItem {
  extinguisherNo: string;
  extinguisherCode: string;
  locationName: string;
  typeName: string;
  globalLastResult: string;
  globalLastDate: string;
}

export interface HistorySummary {
  total: number;
  uniqueInspected: number;
  uniqueNotInspected: number;
  passed: number;
  failed: number;
}

export interface HistoryMonthly {
  month: string;
  pass: number;
  fail: number;
}

export interface HistoryData {
  records: HistoryRecord[];
  extGroups: ExtGroup[];
  notInspectedList: NotInspectedItem[];
  summary: HistorySummary;
  monthly: HistoryMonthly[];
}

export interface HistoryFilter {
  extinguisherNo?: string;
  locationName?: string;
  typeName?: string 
  dateFrom?: string;
  dateTo?: string;
  result?: string;
}

const post = async (body: object) => {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
  return res.json();
};

export const getHistory = (filter: HistoryFilter) =>
  post({ action: "getHistory", ...filter });
