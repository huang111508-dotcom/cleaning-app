import React, { useState, useEffect, useMemo } from 'react';
import { CleaningDataMap, PlanData, Language } from './types';
import { POSITIONS, CLEANING_DATA_ZH, CLEANING_DATA_EN, AREA_TRANSLATIONS, DAY_TRANSLATIONS } from './constants';
import { Calendar, CheckCircle2, Globe, LayoutGrid, Search, AlertCircle, ChevronDown, ChevronUp, MapPin, Clock, AlertTriangle } from 'lucide-react';

// --- 工具函数 ---
const getCurrentWeekOfMonth = () => {
  const today = new Date();
  const date = today.getDate();
  const week = Math.ceil(date / 7);
  return week > 4 ? 4 : week;
};

const getCurrentDayKey = () => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date().getDay()];
};

// --- 组件：折叠卡片 (移除 animate-in，改用标准 transition) ---
const CollapsibleCard: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}> = ({ title, isOpen, onToggle, icon, children, highlight }) => (
  <div className={`rounded-xl shadow-sm border transition-all duration-300 overflow-hidden mb-4 ${
    highlight ? 'border-blue-300 ring-2 ring-blue-100 bg-white' : 'border-gray-200 bg-white'
  }`}>
    <button 
      onClick={onToggle}
      className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
        highlight ? 'bg-blue-50/80' : 'bg-gray-50/50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`${highlight ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
        <h3 className={`font-bold text-lg ${highlight ? 'text-blue-800' : 'text-gray-700'}`}>{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
    </button>
    
    {isOpen && (
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    )}
  </div>
);

// --- 主程序 ---
const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [area, setArea] = useState('');
  const [position, setPosition] = useState('');
  
  const [week, setWeek] = useState<string>('1');
  const [day, setDay] = useState<string>('');

  const [openSections, setOpenSections] = useState({
    daily: true,
    weekly: true,
    monthly: false
  });

  const isZh = language === 'zh';
  const currentData: CleaningDataMap = language === 'zh' ? CLEANING_DATA_ZH : CLEANING_DATA_EN;
  
  // 安全获取数据，防止 undefined 导致崩溃
  const positionData: PlanData | undefined = currentData[position];

  useEffect(() => {
    setWeek(String(getCurrentWeekOfMonth()));
    setDay(getCurrentDayKey());
  }, []);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'));
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- 智能过滤逻辑 ---
  const filterContentByDay = (htmlContent: string, selectedDay: string, isEnglishMode: boolean) => {
    if (!htmlContent || !selectedDay) return htmlContent;
    if (!htmlContent.includes('<br>')) return htmlContent;

    const searchKeyZh = selectedDay; 
    const searchKeyEn = DAY_TRANSLATIONS[selectedDay] || ''; 
    
    const lines = htmlContent.split('<br>');
    const allDaysZh = Object.keys(DAY_TRANSLATIONS);
    const allDaysEn = Object.values(DAY_TRANSLATIONS);

    const filteredLines = lines.filter(line => {
      const lineLower = line.toLowerCase();
      // 检查是否包含其他日期
      const hasOtherDay = allDaysZh.some(d => d !== searchKeyZh && line.includes(d)) ||
                          allDaysEn.some(d => d.toLowerCase() !== searchKeyEn.toLowerCase() && lineLower.includes(d.toLowerCase()));
      // 检查是否包含当前日期
      const hasCurrentDay = line.includes(searchKeyZh) || 
                            (searchKeyEn && lineLower.includes(searchKeyEn.toLowerCase()));

      if (hasCurrentDay) return true;
      if (hasOtherDay) return false;
      return true; // 通用行保留
    });

    if (filteredLines.length === 0) {
      return isZh ? `本日 (${selectedDay}) 无特定周计划任务` : `No specific weekly tasks for ${selectedDay}`;
    }

    return filteredLines.join('<br>');
  };

  // --- 获取显示内容 ---
  const displayWeeklyContent = useMemo(() => {
    if (!positionData) return '';
    let content = positionData.weekly;
    
    // 尝试追加月度任务
    if (week && day && positionData.monthly && typeof positionData.monthly !== 'string') {
        const monthlyTask = positionData.monthly[week]?.[day];
        if (monthlyTask) {
             const label = language === 'zh' ? '月清任务' : 'Monthly Task';
             const displayDay = language === 'zh' ? day : (DAY_TRANSLATIONS[day] || day);
             content += `<br>----------<br><strong class="text-blue-600">${displayDay} ${label}:</strong> ${monthlyTask}`;
        }
    }

    if (day) {
      return filterContentByDay(content, day, !isZh);
    }
    return content || (isZh ? '无每周清洁计划' : 'No weekly cleaning plan');
  }, [positionData, week, day, language, isZh]);

  const getMonthlyContent = () => {
      if (!positionData) return '';
      if (typeof positionData.monthly === 'string') return positionData.monthly;
      if (week && positionData.monthly[week]) {
          const header = isZh ? `第${week}周月清计划:` : `Week ${week} Monthly Plan:`;
          let html = `<strong>${header}</strong><br>`;
          const todayTask = positionData.monthly[week][day];
          
          if (day && todayTask) {
             const displayDay = isZh ? day : (DAY_TRANSLATIONS[day] || day);
             return `<strong>${header}</strong><br><span class="text-blue-600 font-bold">👉 ${displayDay}: ${todayTask}</span>`;
          }

          Object.entries(positionData.monthly[week]).forEach(([d, task]) => {
              const displayDay = isZh ? d : (DAY_TRANSLATIONS[d] || d);
              html += `${displayDay}: ${task}<br>`;
          });
          return html;
      }
      return isZh ? '无每月清洁计划' : 'No monthly cleaning plan';
  };

  const getMonthlyDetails = () => {
    if (!positionData) return '';
    if (typeof positionData.monthlyDetails === 'string') return positionData.monthlyDetails;
    if (week && positionData.monthlyDetails[week]) {
        return positionData.monthlyDetails[week];
    }
    return language === 'zh' ? '无月清细则' : 'No monthly cleaning details';
  };

  // --- 调试渲染 ---
  // 如果选择了岗位，但找不到数据，说明 constants.ts 里的 Key 和 ID 对不上
  if (position && !positionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">数据加载错误 (Data Error)</h2>
        <p className="text-gray-600 mb-4">
          无法找到 ID 为 <strong>"{position}"</strong> 的岗位数据。
        </p>
        <div className="bg-white p-4 rounded shadow text-left text-sm font-mono overflow-auto max-w-full">
          <p className="text-gray-500 mb-1">请检查 constants.ts:</p>
          <p>1. POSITIONS 里的 id: "{position}"</p>
          <p>2. CLEANING_DATA_ZH 里的 Key 是否也是 "{position}"?</p>
          <p className="mt-2 text-red-500">它们必须完全一致（注意空格）。</p>
        </div>
        <button onClick={() => setPosition('')} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded">
          返回重试
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-bold truncate">
              {isZh ? '龙城清洁 2.0' : 'Cleaning Plan 2.0'}
            </h1>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all text-sm font-medium backdrop-blur-sm"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{isZh ? 'EN' : '中文'}</span>
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Filter Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
             <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center">
                   <MapPin className="w-3 h-3 mr-1"/> {isZh ? '区域 / Area' : 'Area'}
                </label>
                <select
                  value={area}
                  onChange={(e) => { setArea(e.target.value); setPosition(''); }}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                >
                  <option value="">{isZh ? '请选择区域' : 'Select Area'}</option>
                  {Object.keys(POSITIONS).map((key) => (
                    <option key={key} value={key}>{isZh ? key : (AREA_TRANSLATIONS[key] || key)}</option>
                  ))}
                </select>
             </div>
             
             <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block flex items-center">
                   <Search className="w-3 h-3 mr-1"/> {isZh ? '岗位 / Position' : 'Position'}
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={!area}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{isZh ? '请选择岗位' : 'Select Position'}</option>
                  {area && POSITIONS[area]?.map((pos) => (
                    <option key={pos.id} value={pos.id}>{isZh ? pos.name : pos.enName}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          <div className="space-y-4">
            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                   <Clock className="w-3 h-3 mr-1"/> {isZh ? '选择日期' : 'Select Day'}
                 </label>
                 <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {isZh ? `第 ${week} 周` : `Week ${week}`}
                 </span>
               </div>
               
               <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                 {Object.entries(DAY_TRANSLATIONS).map(([zhKey, enVal]) => {
                   const isActive = day === zhKey;
                   return (
                     <button
                       key={zhKey}
                       onClick={() => setDay(zhKey)}
                       className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                         isActive 
                           ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                       }`}
                     >
                       {isZh ? zhKey.replace('周', '') : enVal.slice(0, 3)}
                     </button>
                   );
                 })}
               </div>
            </div>

             <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">{isZh ? '切换周数:' : 'Change Week:'}</span>
                {[1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    onClick={() => setWeek(String(w))}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center transition-colors ${
                      week === String(w) ? 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Content Area */}
        {!position ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">
               {isZh ? '准备就绪' : 'Ready'}
             </h3>
             <p className="text-gray-500 mt-1 max-w-sm mx-auto">
               {isZh ? '请在上方选择您所在的区域和岗位。' : 'Please select your area and position above.'}
             </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Daily */}
            <CollapsibleCard 
              title={isZh ? '每日必做' : 'Daily Routine'} 
              icon={<CheckCircle2 className="h-5 w-5" />}
              isOpen={openSections.daily}
              onToggle={() => toggleSection('daily')}
              highlight={true}
            >
               <div className="p-5 bg-blue-50/30">
                  <div className="prose prose-sm prose-blue max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: positionData?.daily || (isZh ? '暂无数据' : 'No Data') }} />
               </div>
               <div className="p-5 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{isZh ? '执行细则' : 'Details'}</div>
                  <div className="prose prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: positionData?.dailyDetails || (isZh ? '暂无' : 'None') }} />
               </div>
            </CollapsibleCard>

            {/* Weekly */}
            <CollapsibleCard 
              title={`${isZh ? day : (DAY_TRANSLATIONS[day] || day)} ${isZh ? '重点任务' : 'Tasks'}`}
              icon={<Calendar className="h-5 w-5" />}
              isOpen={openSections.weekly}
              onToggle={() => toggleSection('weekly')}
              highlight={false} 
            >
               <div className="p-5">
                  <div className="flex items-center mb-3 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {isZh ? `已为您筛选 ${day} 的任务` : `Showing tasks for ${day}`}
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayWeeklyContent }} />
               </div>
               <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{isZh ? '周清通用细则' : 'Weekly Details'}</div>
                  <div className="prose prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: positionData?.weeklyDetails || (isZh ? '暂无' : 'None') }} />
               </div>
            </CollapsibleCard>

            {/* Monthly */}
            <CollapsibleCard 
              title={isZh ? '本月/特定任务' : 'Monthly / Special'} 
              icon={<LayoutGrid className="h-5 w-5" />}
              isOpen={openSections.monthly}
              onToggle={() => toggleSection('monthly')}
            >
               <div className="p-5">
                  <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: getMonthlyContent() }} />
               </div>
               <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                   <div className="text-xs font-bold text-gray-400 uppercase mb-2">{isZh ? '月清细则' : 'Monthly Details'}</div>
                   <div className="prose prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: getMonthlyDetails() }} />
               </div>
            </CollapsibleCard>

          </div>
        )}
      </main>

      <footer className="mt-8 py-6 bg-white border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
           {new Date().getFullYear()} © {isZh ? '龙城店清洁管理系统 v2.0' : 'Longcheng Cleaning Management System v2.0'}
        </p>
      </footer>
    </div>
  );
};

export default App;