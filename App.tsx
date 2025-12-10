import React, { useState, useEffect, useMemo } from 'react';
import { AreaPositions, CleaningDataMap, PlanData, Language } from './types';
import { POSITIONS, CLEANING_DATA_ZH, CLEANING_DATA_EN, AREA_TRANSLATIONS, DAY_TRANSLATIONS } from './constants';
import { Calendar, CheckCircle2, Globe, LayoutGrid, Search, AlertCircle, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';

// --- 工具函数：计算当前是第几周 (简易版：按当月第几个7天计算) ---
const getCurrentWeekOfMonth = () => {
  const today = new Date();
  const date = today.getDate();
  const week = Math.ceil(date / 7);
  return week > 4 ? 4 : week; // 只有1-4周，超过算第4周
};

// --- 工具函数：获取当前星期几的中文 Key ---
const getCurrentDayKey = () => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date().getDay()];
};

// --- 组件：折叠卡片 ---
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
      <div className="divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
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
  
  // 状态：周和天 (默认空，useEffect 中初始化)
  const [week, setWeek] = useState<string>('1');
  const [day, setDay] = useState<string>('');

  // 状态：卡片折叠控制
  const [openSections, setOpenSections] = useState({
    daily: true,
    weekly: true,
    monthly: false
  });

  const isZh = language === 'zh';
  const currentData: CleaningDataMap = language === 'zh' ? CLEANING_DATA_ZH : CLEANING_DATA_EN;
  const positionData: PlanData | undefined = currentData[position];

  // 🚀 2.0新功能：初始化自动定位到今天
  useEffect(() => {
    setWeek(String(getCurrentWeekOfMonth()));
    setDay(getCurrentDayKey());
  }, []);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'));
  
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 🚀 2.0核心逻辑：智能过滤周计划文本
  // 将一大段HTML文本按<br>拆分，只返回包含当前选中日期的行
  const filterContentByDay = (htmlContent: string, selectedDay: string, isEnglishMode: boolean) => {
    if (!htmlContent || !selectedDay) return htmlContent;
    
    // 如果是简单文本（不包含<br>），直接返回
    if (!htmlContent.includes('<br>')) return htmlContent;

    // 获取搜索关键词 (例如：中文搜"周一"，英文搜"Monday")
    const searchKeyZh = selectedDay; 
    const searchKeyEn = DAY_TRANSLATIONS[selectedDay] || ''; 
    
    // 拆分行
    const lines = htmlContent.split('<br>');
    
    // 过滤逻辑：
    // 1. 如果行里包含 "周一" 或 "Monday" -> 保留
    // 2. 如果行里完全没有星期几的关键词 -> 保留 (可能是通用指令)
    // 3. 如果行里包含 "周二" (而选的是周一) -> 剔除
    
    const allDaysZh = Object.keys(DAY_TRANSLATIONS);
    const allDaysEn = Object.values(DAY_TRANSLATIONS);

    const filteredLines = lines.filter(line => {
      const lineLower = line.toLowerCase();
      
      // 检查这行是否包含 *其他* 日期
      const hasOtherDay = allDaysZh.some(d => d !== searchKeyZh && line.includes(d)) ||
                          allDaysEn.some(d => d.toLowerCase() !== searchKeyEn.toLowerCase() && lineLower.includes(d.toLowerCase()));
      
      // 检查这行是否包含 *当前* 日期
      const hasCurrentDay = line.includes(searchKeyZh) || 
                            (searchKeyEn && lineLower.includes(searchKeyEn.toLowerCase()));

      // 如果包含当前日期，保留
      if (hasCurrentDay) return true;
      // 如果包含其他日期，剔除
      if (hasOtherDay) return false;
      // 如果都不包含（通用说明），保留
      return true;
    });

    if (filteredLines.length === 0) {
      return isZh ? `本日 (${selectedDay}) 无特定周计划任务` : `No specific weekly tasks for ${selectedDay}`;
    }

    return filteredLines.join('<br>');
  };

  // 获取处理后的周内容
  const displayWeeklyContent = useMemo(() => {
    if (!positionData) return '';
    let content = positionData.weekly;
    
    // 1. 先尝试追加月度任务 (原有逻辑)
    if (week && day && positionData.monthly && typeof positionData.monthly !== 'string') {
        const monthlyTask = positionData.monthly[week]?.[day];
        if (monthlyTask) {
             const label = language === 'zh' ? '月清任务' : 'Monthly Task';
             const displayDay = language === 'zh' ? day : (DAY_TRANSLATIONS[day] || day);
             // 加上明显的标记
             content += `<br>----------<br><strong class="text-blue-600">${displayDay} ${label}:</strong> ${monthlyTask}`;
        }
    }

    // 2. 执行智能过滤 (新功能)
    if (day) {
      return filterContentByDay(content, day, !isZh);
    }
    
    return content || (isZh ? '无每周清洁计划' : 'No weekly cleaning plan');
  }, [positionData, week, day, language, isZh]);


  // 获取月度内容 (保持原有逻辑，优化显示)
  const getMonthlyContent = () => {
      if (!positionData) return '';
      if (typeof positionData.monthly === 'string') return positionData.monthly;
      if (week && positionData.monthly[week]) {
          const header = isZh ? `第${week}周月清计划:` : `Week ${week} Monthly Plan:`;
          let html = `<strong>${header}</strong><br>`;
          // 只显示当天
          const todayTask = positionData.monthly[week][day];
          
          if (day && todayTask) {
             const displayDay = isZh ? day : (DAY_TRANSLATIONS[day] || day);
             return `<strong>${header}</strong><br><span class="text-blue-600 font-bold">👉 ${displayDay}: ${todayTask}</span>`;
          }

          // 如果没选天，或者当天没任务，显示全部
          Object.entries(positionData.monthly[week]).forEach(([d, task]) => {
              const displayDay = isZh ? d : (DAY_TRANSLATIONS[d] || d);
              html += `${displayDay}: ${task}<br>`;
          });
          return html;
      }
      return isZh ? '无每月清洁计划' : 'No monthly cleaning plan';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 1. Header (更紧凑) */}
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
        
        {/* 2. 顶部控制区 (卡片式) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
          
          {/* 第一行：区域和岗位 */}
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

          {/* 第二行：时间选择 (全新的 UI) */}
          <div className="space-y-4">
            {/* 星期选择器 (Pills) */}
            <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                   <Clock className="w-3 h-3 mr-1"/> {isZh ? '选择日期' : 'Select Day'}
                 </label>
                 <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {isZh ? `第 ${week} 周` : `Week ${week}`}
                 </span>
               </div>
               
               {/* 星期滚动容器 */}
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

             {/* 周数选择 (简单的数字球) */}
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

        {/* 3. 内容展示区 */}
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 每日计划 (Daily) */}
            <CollapsibleCard 
              title={isZh ? '每日必做' : 'Daily Routine'} 
              icon={<CheckCircle2 className="h-5 w-5" />}
              isOpen={openSections.daily}
              onToggle={() => toggleSection('daily')}
              highlight={true} // 每日必做总是高亮
            >
               <div className="p-5 bg-blue-50/30">
                  <div className="prose prose-sm prose-blue max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: positionData?.daily || '' }} />
               </div>
               <div className="p-5 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{isZh ? '执行细则' : 'Details'}</div>
                  <div className="prose prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: positionData?.dailyDetails || '' }} />
               </div>
            </CollapsibleCard>

            {/* 每周计划 (Weekly - 经过智能过滤) */}
            <CollapsibleCard 
              title={`${isZh ? day : (DAY_TRANSLATIONS[day] || day)} ${isZh ? '重点任务' : 'Tasks'}`}
              icon={<Calendar className="h-5 w-5" />}
              isOpen={openSections.weekly}
              onToggle={() => toggleSection('weekly')}
              highlight={false} 
            >
               <div className="p-5">
                  {/* 提示用户这里只显示了当天的 */}
                  <div className="flex items-center mb-3 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {isZh ? `已为您筛选 ${day} 的任务` : `Showing tasks for ${day}`}
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayWeeklyContent }} />
               </div>
               <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{isZh ? '周清通用细则' : 'Weekly Details'}</div>
                  <div className="prose prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: positionData?.weeklyDetails || '' }} />
               </div>
            </CollapsibleCard>

            {/* 每月计划 (Monthly) */}
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