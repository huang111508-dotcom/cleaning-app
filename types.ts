export interface Position {
  id: string;
  name: string;
  enName: string;
}

export interface AreaPositions {
  [key: string]: Position[];
}

export interface MonthlyPlanObject {
  [week: string]: {
    [day: string]: string;
  };
}

export interface MonthlyDetailsObject {
  [week: string]: string;
}

export interface PlanData {
  daily: string;
  dailyDetails: string;
  weekly: string;
  weeklyDetails: string;
  monthly: string | MonthlyPlanObject;
  monthlyDetails: string | MonthlyDetailsObject;
}

export interface CleaningDataMap {
  [key: string]: PlanData;
}

export type Language = 'zh' | 'en';