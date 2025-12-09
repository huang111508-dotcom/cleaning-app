import React, { useState } from 'react';
import { AreaPositions, CleaningDataMap, PlanData, Language } from './types';
// 注意：这里引入了新加的翻译字典 AREA_TRANSLATIONS 和 DAY_TRANSLATIONS
import { POSITIONS, CLEANING_DATA_ZH, CLEANING_DATA_EN, AREA_TRANSLATIONS, DAY_TRANSLATIONS } from './constants';
import { Calendar, CheckCircle2, Globe, LayoutGrid, Search, AlertCircle } from 'lucide-react';

const Header: React.FC<{ language: Language; onToggleLanguage: () => void }> = ({
  language,
  onToggleLanguage,
}) => (
  <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <LayoutGrid className="h-6 w-6" />
        <h1 className="text-xl font-bold md:text-2xl truncate">
          {language === 'zh' ? '龙城店清洁计划查询系统' : 'Cleaning Plan Query System'}
        </h1>
      </div>
      <button
        onClick={onToggleLanguage}
        className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md transition-colors text-sm font-medium"
      >
        <Globe className="h-4 w-4" />
        <span>{language === 'zh' ? 'EN' : '中文'}</span>
      </button>
    </div>
  </header>
);

const FilterSection: React.FC<{
  language: Language;
  area: string;
  setArea: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  week: string;
  setWeek: (v: string) => void;
  day: string;
  setDay: (v: string) => void;
}> = ({ language, area, setArea, position, setPosition, week, setWeek, day, setDay }) => {
  const isZh = language === 'zh';

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Area Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 block">
            {isZh ? '区域 / Area' : 'Area'}
          </label>
          <div className="relative">
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setPosition('');
              }}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="">{isZh ? '请选择 / Please select' : 'Please select'}</option>
              {Object.keys(POSITIONS).map((key) => (
                <option key={key} value={key}>
                  {/* 核心修改：如果是英文模式，去查翻译字典；查不到就显示原文 */}
                  {isZh ? key : (AREA_TRANSLATIONS[key] || key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Position Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 block">
            {isZh ? '岗位 / Position' : 'Position'}
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={!area}
            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{isZh ? '请选择 / Please select' : 'Please select'}</option>
            {area &&
              POSITIONS[area]?.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {isZh ? pos.name : pos.enName}
                </option>
              ))}
          </select>
        </div>

        {/* Week Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 block">
            {isZh ? '第几周 / Week' : 'Week'}
          </label>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="">{isZh ? '请选择 / Please select' : 'Please select'}</option>
            <option value="1">{isZh ? '第一周 / Week 1' : 'Week 1'}</option>
            <option value="2">{isZh ? '第二周 / Week 2' : 'Week 2'}</option>
            <option value="3">{isZh ? '第三周 / Week 3' : 'Week 3'}</option>
            <option value="4">{isZh ? '第四周 / Week 4' : 'Week 4'}</option>
          </select>
        </div>

        {/* Day Select */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 block">
            {isZh ? '周几 / Day' : 'Day'}
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="">{isZh ? '请选择 / Please select' : 'Please select'}</option>
            {/* 核心修改：使用翻译字典生成下拉选项 */}
            {Object.entries(DAY_TRANSLATIONS).map(([zhKey, enVal]) => (
                <option key={zhKey} value={zhKey}>
                   {isZh ? `${zhKey} / ${enVal}` : enVal}
                </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const PlanCard: React.FC<{
  title: string;
  content: string;
  detailsTitle: string;
  detailsContent: string;
  icon: React.ReactNode;
}> = ({ title, content, detailsTitle, detailsContent, icon }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 transition-all hover:shadow-md">
    <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center space-x-2">
      <div className="text-blue-600">{icon}</div>
      <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
    </div>
    <div className="divide-y divide-gray-100">
      <div className="p-4 md:p-6 bg-gray-50/50">
        <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Plan</h4>
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
      <div className="p-4 md:p-6">
        <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-3">{detailsTitle}</h4>
        <div
          className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: detailsContent }}
        />
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [area, setArea] = useState('');
  const [position, setPosition] = useState('');
  const [week, setWeek] = useState('');
  const [day, setDay] = useState('');

  const currentData: CleaningDataMap = language === 'zh' ? CLEANING_DATA_ZH : CLEANING_DATA_EN;
  const positionData: PlanData | undefined = currentData[position];

  const toggleLanguage = () => setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'));

  // Logic to process weekly data
  const getWeeklyContent = () => {
    if (!positionData) return '';
    let content = positionData.weekly;
    
    // 核心修改：在追加月度任务时，把“周一”翻译成“Monday”
    if (week && day && positionData.monthly && typeof positionData.monthly !== 'string') {
        const monthlyTask = positionData.monthly[week]?.[day];
        if (monthlyTask) {
             const label = language === 'zh' ? '月清任务' : 'Monthly Task';
             const displayDay = language === 'zh' ? day : (DAY_TRANSLATIONS[day] || day);
             content += `<br><br><strong>${displayDay} ${label}:</strong> ${monthlyTask}`;
        }
    }
    return content || (language === 'zh' ? '无每周清洁计划' : 'No weekly cleaning plan');
  };

  const getMonthlyContent = () => {
      if (!positionData) return '';
      if (typeof positionData.monthly === 'string') return positionData.monthly;
      if (week && positionData.monthly[week]) {
          const header = language === 'zh' ? `第${week}周月清计划:` : `Week ${week} Monthly Plan:`;
          let html = `<strong>${header}</strong><br>`;
          Object.entries(positionData.monthly[week]).forEach(([d, task]) => {
              // 核心修改：在列表显示时，把“周一”翻译成“Monday”
              const displayDay = language === 'zh' ? d : (DAY_TRANSLATIONS[d] || d);
              html += `${displayDay}: ${task}<br>`;
          });
          return html;
      }
      return language === 'zh' ? '无每月清洁计划' : 'No monthly cleaning plan';
  };

  const getMonthlyDetails = () => {
      if (!positionData) return '';
      if (typeof positionData.monthlyDetails === 'string') return positionData.monthlyDetails;
      if (week && positionData.monthlyDetails[week]) {
          return positionData.monthlyDetails[week];
      }
      return language === 'zh' ? '无月清细则' : 'No monthly cleaning details';
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header language={language} onToggleLanguage={toggleLanguage} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <FilterSection
          language={language}
          area={area}
          setArea={setArea}
          position={position}
          setPosition={setPosition}
          week={week}
          setWeek={setWeek}
          day={day}
          setDay={setDay}
        />

        {!position || !area ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
            <Search className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {language === 'zh'
                ? '请选择区域和岗位以查看清洁计划'
                : 'Please select an area and position to view the cleaning plan.'}
            </p>
            <p className="text-sm mt-2">
               {language === 'zh' ? '选择周数和日期以查看特定任务' : 'Select week and day for specific tasks.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
             {/* Note if week/day not selected */}
             {(!week || !day) && (
                 <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md flex items-start">
                     <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                     <div>
                         <p className="text-sm text-yellow-700 font-medium">
                             {language === 'zh' ? '提示：选择具体的“第几周”和“周几”可以查看更详细的任务。' : 'Tip: Select a specific "Week" and "Day" to see detailed scheduled tasks.'}
                         </p>
                     </div>
                 </div>
             )}

            <PlanCard
              title={language === 'zh' ? '每日清洁计划及细则' : 'Daily Cleaning Plan & Details'}
              content={positionData?.daily || (language === 'zh' ? '无' : 'None')}
              detailsTitle={language === 'zh' ? '日清细则' : 'Details'}
              detailsContent={positionData?.dailyDetails || (language === 'zh' ? '无' : 'None')}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />

            <PlanCard
              title={language === 'zh' ? '每周清洁计划及细则' : 'Weekly Cleaning Plan & Details'}
              content={getWeeklyContent()}
              detailsTitle={language === 'zh' ? '周清细则' : 'Details'}
              detailsContent={positionData?.weeklyDetails || (language === 'zh' ? '无' : 'None')}
              icon={<Calendar className="h-5 w-5" />}
            />

            <PlanCard
              title={language === 'zh' ? '每月清洁计划及细则' : 'Monthly Cleaning Plan & Details'}
              content={getMonthlyContent()}
              detailsTitle={language === 'zh' ? '月清细则' : 'Details'}
              detailsContent={getMonthlyDetails()}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} {language === 'zh' ? '龙城店清洁计划查询系统' : 'Longcheng Store Cleaning Plan Query System'}
          </div>
      </footer>
    </div>
  );
};

export default App;