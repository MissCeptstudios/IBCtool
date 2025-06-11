import React, { useState, useEffect } from 'react';

const IBCtool = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('basic');
  const [activeTab, setActiveTab] = useState('calculator');
  const [expression, setExpression] = useState('');
  const [openParentheses, setOpenParentheses] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [memory, setMemory] = useState({
    wacc: 8.5,
    terminalGrowth: 2.5,
    discountRate: 10,
    revenue: 0,
    ebitda: 0,
    netIncome: 0,
    shares: 0,
    marketCap: 0,
    enterprise: 0,
    debtEquityRatio: 4.0,
    debtEbitdaMultiple: 6.0,
    initialInvestment: 0,
    cashFlows: [],
    currentCashFlow: 0
  });

  const [exchangeRates, setExchangeRates] = useState({
    USD: 1.0000,
    EUR: 0.9150,
    JPY: 142.30,
    GBP: 0.7820,
    CHF: 0.8850,
    CAD: 1.3720,
    CNY: 7.2800,
    PLN: 4.0500,
    AUD: 1.4950,
    SEK: 10.8500
  });
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedToCurrency, setSelectedToCurrency] = useState('EUR');
  const [showTutorial, setShowTutorial] = useState(false);

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockData = {
        rates: {
          EUR: 0.9234 + (Math.random() - 0.5) * 0.02,
          JPY: 147.85 + (Math.random() - 0.5) * 3,
          GBP: 0.7912 + (Math.random() - 0.5) * 0.015,
          CHF: 0.8923 + (Math.random() - 0.5) * 0.012,
          CAD: 1.3567 + (Math.random() - 0.5) * 0.025,
          CNY: 7.2456 + (Math.random() - 0.5) * 0.15,
          PLN: 4.0234 + (Math.random() - 0.5) * 0.08,
          AUD: 1.5123 + (Math.random() - 0.5) * 0.03,
          SEK: 10.7834 + (Math.random() - 0.5) * 0.25
        }
      };
      
      setExchangeRates({
        USD: 1.0000,
        ...mockData.rates
      });
      setRatesLastUpdated(new Date());
      setIsLoadingRates(false);
    } catch (error) {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setExpression('');
    setOpenParentheses(0);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '×': return firstValue * secondValue;
      case '÷': return secondValue !== 0 ? firstValue / secondValue : 0;
      case '%': return firstValue % secondValue;
      case '^': return Math.pow(firstValue, secondValue);
      default: return secondValue;
    }
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(newValue);
      const calculation = `${formatNumber(currentValue)} ${operation} ${formatNumber(inputValue)} = ${formatNumber(newValue)}`;
      setHistory(prev => [calculation, ...prev.slice(0, 19)]);
    }
    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const performEquals = () => {
    const inputValue = parseFloat(display);
    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      const calculation = `${formatNumber(previousValue)} ${operation} ${formatNumber(inputValue)} = ${formatNumber(newValue)}`;
      setHistory(prev => [calculation, ...prev.slice(0, 19)]);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const calculateDCF = () => {
    const fcf = parseFloat(display);
    const wacc = memory.wacc / 100;
    const terminalGrowth = memory.terminalGrowth / 100;
    const projectionYears = 5;
    
    let pv = 0;
    const initialGrowth = 0.15;
    const growthDecline = 0.02;
    
    for (let year = 1; year <= projectionYears; year++) {
      const yearGrowth = Math.max(initialGrowth - (growthDecline * (year - 1)), terminalGrowth);
      const fcfYear = fcf * Math.pow(1 + yearGrowth, year);
      pv += fcfYear / Math.pow(1 + wacc, year);
    }
    
    const finalYearGrowth = Math.max(initialGrowth - (growthDecline * projectionYears), terminalGrowth);
    const terminalFCF = fcf * Math.pow(1 + finalYearGrowth, projectionYears) * (1 + terminalGrowth);
    const terminalValue = terminalFCF / (wacc - terminalGrowth);
    const terminalPV = terminalValue / Math.pow(1 + wacc, projectionYears);
    
    const enterpriseValue = pv + terminalPV;
    const result = Math.round(enterpriseValue);
    
    setDisplay(String(result));
    setHistory(prev => [`DCF: FCF=${formatNumber(fcf)}, WACC=${memory.wacc}%, TG=${memory.terminalGrowth}% = ${formatNumber(result)}`, ...prev.slice(0, 19)]);
    setWaitingForOperand(true);
  };

  const storeMemory = (key) => {
    const value = parseFloat(display);
    setMemory(prev => ({ ...prev, [key]: value }));
    setHistory(prev => [`Stored ${key.toUpperCase()}: ${formatNumber(value)}`, ...prev.slice(0, 19)]);
  };

  const convertCurrency = (fromCurrency, toCurrency, amount) => {
    const usdAmount = amount / exchangeRates[fromCurrency];
    return usdAmount * exchangeRates[toCurrency];
  };

  const performForexConversion = (toCurrency) => {
    const amount = parseFloat(display);
    if (isNaN(amount) || amount === 0) return;
    
    const convertedAmount = convertCurrency(selectedCurrency, toCurrency, amount);
    const formattedResult = convertedAmount < 0.01 ? convertedAmount.toFixed(6) : convertedAmount.toFixed(4);
    setDisplay(String(formattedResult));
    setHistory(prev => [`${amount.toFixed(2)} ${selectedCurrency} = ${formattedResult} ${toCurrency}`, ...prev.slice(0, 19)]);
    setWaitingForOperand(true);
  };

  const getCurrencyName = (code) => {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      JPY: 'Japanese Yen',
      GBP: 'British Pound',
      CHF: 'Swiss Franc',
      CAD: 'Canadian Dollar',
      CNY: 'Chinese Yuan',
      PLN: 'Polish Zloty',
      AUD: 'Australian Dollar',
      SEK: 'Swedish Krona'
    };
    return names[code] || code;
  };

  const swapCurrencies = () => {
    const temp = selectedCurrency;
    setSelectedCurrency(selectedToCurrency);
    setSelectedToCurrency(temp);
  };

  const formatNumber = (num) => {
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const Button = ({ onClick, className = '', children, variant = 'default', size = 'normal', disabled = false }) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 active:scale-95 shadow-sm border select-none';
    
    // Improved mobile-first responsive sizing
    const sizes = {
      normal: 'h-12 md:h-14 text-sm md:text-base px-3 md:px-4 min-w-0', // Larger buttons on mobile
      small: 'h-10 md:h-12 text-xs md:text-sm px-2 md:px-3 min-w-0',
      large: 'h-14 md:h-16 text-base md:text-lg px-4 md:px-5 min-w-0'
    };
    
    const variants = isDarkMode ? {
      default: disabled ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-100 border-gray-600 hover:border-gray-500',
      operator: 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-yellow-400 border-gray-600 hover:border-yellow-400',
      equals: 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold border-yellow-400',
      function: disabled ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-blue-400 border-gray-600',
      clear: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-red-500',
      ib: 'bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-black font-semibold border-yellow-500',
      memory: 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white border-purple-500',
      swap: 'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold border-green-500',
      theme: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-yellow-400 border-gray-500 hover:border-yellow-400'
    } : {
      default: disabled ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400',
      operator: 'bg-white hover:bg-yellow-50 active:bg-yellow-100 text-yellow-600 border-yellow-300 hover:border-yellow-400',
      equals: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-bold border-yellow-500',
      function: disabled ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-600 border-blue-300',
      clear: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border-red-500',
      ib: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black font-semibold border-yellow-400',
      memory: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white border-purple-500',
      swap: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold border-green-500',
      theme: 'bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 text-gray-800 border-yellow-300 hover:border-yellow-400'
    };
    
    return (
      <button
        className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  return (
    <div className={`w-full max-w-sm md:max-w-3xl mx-auto rounded-2xl shadow-2xl p-2 md:p-6 mt-2 md:mt-8 border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    } min-h-screen md:min-h-0`}>
      
      {/* Header - Improved mobile layout */}
      <div className="text-center mb-3 md:mb-6">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <Button
            variant="function"
            size="small"
            onClick={() => setShowTutorial(true)}
            className="w-12 md:w-20 h-8 md:h-10 flex items-center justify-center text-xs"
            title="Learn how to use this mode"
          >
            <span className="hidden md:inline">📚 Help</span>
            <span className="md:hidden">?</span>
          </Button>
          <h1 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <span className="hidden md:inline">Investment Banking Calculator</span>
            <span className="md:hidden">IBC Tool</span>
          </h1>
          <Button
            variant="theme"
            size="small"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-8 md:w-12 h-8 md:h-10 flex items-center justify-center text-xs"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </Button>
        </div>
        <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="hidden md:inline">Professional financial modeling and analysis tool by MissCept</span>
          <span className="md:hidden">Financial modeling by MissCept</span>
        </p>
      </div>

      {/* Tutorial Modal - Better mobile positioning */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Help - {activeTab.toUpperCase()}
                </h2>
                <button
                  onClick={() => setShowTutorial(false)}
                  className={`text-2xl ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  ×
                </button>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <p>Welcome to the IBC Tool! This is a comprehensive financial calculator with multiple modes:</p>
                <ul className="mt-2 space-y-1">
                  <li>• <strong>Calculator:</strong> Basic arithmetic with financial shortcuts</li>
                  <li>• <strong>Models:</strong> DCF, Comps, LBO, IRR/NPV analysis</li>
                  <li>• <strong>Forex:</strong> Currency conversion</li>
                  <li>• <strong>Scientific:</strong> Advanced mathematical functions</li>
                </ul>
                <p className="mt-3 text-xs">Navigate between tabs to access different tools. Each mode has specialized functions for financial analysis.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation - Improved mobile design */}
      <div className={`flex rounded-xl mb-3 md:mb-6 border overflow-hidden ${
        isDarkMode ? 'border-gray-600' : 'border-gray-200'
      }`}>
        {[
          { key: 'calculator', label: 'Calc', fullLabel: 'Calculator' },
          { key: 'models', label: 'Models', fullLabel: 'Models' },
          { key: 'forex', label: 'FX', fullLabel: 'Forex' },
          { key: 'scientific', label: 'Sci', fullLabel: 'Scientific' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'calculator') setMode('basic');
              else if (tab.key === 'models') setMode('dcf');
              else if (tab.key === 'forex') setMode('forex');
              else if (tab.key === 'scientific') setMode('scientific');
            }}
            className={`flex-1 py-3 px-2 text-xs md:text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? isDarkMode
                  ? 'bg-yellow-600 text-black'
                  : 'bg-yellow-400 text-black'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="md:hidden">{tab.label}</span>
            <span className="hidden md:inline">{tab.fullLabel}</span>
          </button>
        ))}
      </div>

      {/* Display - Improved mobile sizing */}
      <div className="mb-3 md:mb-6">
        <div className={`p-3 md:p-6 rounded-xl mb-2 md:mb-4 border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-black text-white border-gray-600' 
            : 'bg-gray-50 text-gray-800 border-gray-200'
        }`}>
          <div className="text-right text-2xl md:text-3xl font-mono overflow-hidden mb-2 break-all">
            {formatNumber(parseFloat(display) || 0)}
          </div>
          <div className={`text-right text-sm md:text-lg mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} break-all`}>
            {parseFloat(display) >= 1000000 ? `${parseFloat(display).toLocaleString()}` : display}
          </div>
          {operation && previousValue !== null && (
            <div className={`text-right text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatNumber(previousValue)} {operation}
            </div>
          )}
        </div>

        {/* Mode Selector - Only show for Models tab */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-4 gap-1 md:gap-2 mb-2 md:mb-4">
            {[
              { key: 'dcf', label: 'DCF' },
              { key: 'comps', label: 'COMPS' },
              { key: 'lbo', label: 'LBO' },
              { key: 'irr_npv', label: 'IRR/NPV' }
            ].map((m) => (
              <Button
                key={m.key}
                variant={mode === m.key ? 'ib' : 'default'}
                size="small"
                onClick={() => setMode(m.key)}
                className="flex-1 text-xs"
              >
                {m.label}
              </Button>
            ))}
          </div>
        )}

        {/* Compact History for mobile */}
        {history.length > 0 && (
          <div className={`p-2 md:p-3 rounded-lg max-h-20 md:max-h-32 overflow-y-auto border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-gray-100 border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-1">
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                History
              </div>
              <Button
                variant="clear"
                size="small"
                onClick={() => setHistory([])}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            {history.slice(0, 3).map((calc, index) => (
              <div key={index} className={`text-xs font-mono mb-1 p-1 rounded transition-all duration-300 break-all ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-700' 
                  : 'text-gray-700 bg-white border border-gray-200'
              }`}>
                {calc}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab-specific function panels - Compact for mobile */}
      {activeTab === 'models' && mode === 'dcf' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 mb-2 md:mb-4">
          <Button variant="ib" size="small" onClick={calculateDCF}>DCF Model</Button>
          <Button variant="memory" size="small" onClick={() => storeMemory('wacc')}>Set WACC</Button>
          <Button variant="memory" size="small" onClick={() => storeMemory('terminalGrowth')}>Set TG</Button>
          <Button variant="memory" size="small" onClick={() => storeMemory('enterprise')}>Set EV</Button>
        </div>
      )}

      {activeTab === 'forex' && (
        <div className="mb-2 md:mb-4">
          <div className="grid grid-cols-5 gap-1 md:gap-2 mb-2 md:mb-3">
            <div className="col-span-2">
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                From
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className={`w-full border rounded-lg px-2 py-2 text-xs focus:outline-none transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-500 focus:border-yellow-400' 
                    : 'bg-white text-gray-800 border-gray-300 focus:border-yellow-500'
                }`}
              >
                {Object.keys(exchangeRates).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-center">
              <Button 
                variant="swap" 
                size="small"
                onClick={swapCurrencies}
                className="h-10 w-10 flex items-center justify-center p-0 text-xs"
                title="Swap currencies"
              >
                ⇄
              </Button>
            </div>
            <div className="col-span-2">
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                To
              </label>
              <select
                value={selectedToCurrency}
                onChange={(e) => setSelectedToCurrency(e.target.value)}
                className={`w-full border rounded-lg px-2 py-2 text-xs focus:outline-none transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-500 focus:border-yellow-400' 
                    : 'bg-white text-gray-800 border-gray-300 focus:border-yellow-500'
                }`}
              >
                {Object.keys(exchangeRates).filter(c => c !== selectedCurrency).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 md:gap-2">
            <Button variant="ib" size="small" onClick={() => performForexConversion(selectedToCurrency)}>
              Convert
            </Button>
            <Button 
              variant="function" 
              size="small"
              onClick={fetchExchangeRates}
              disabled={isLoadingRates}
            >
              {isLoadingRates ? 'Update...' : 'Refresh'}
            </Button>
          </div>
        </div>
      )}

      {/* Basic Calculator Layout - Optimized button grid for mobile */}
      <div className="space-y-2 md:space-y-3">
        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button variant="clear" onClick={clear}>AC</Button>
          <Button variant="function" onClick={() => setDisplay(display.slice(0, -1) || '0')}>⌫</Button>
          <Button variant="operator" onClick={() => performOperation('%')}>%</Button>
          <Button variant="operator" onClick={() => performOperation('÷')}>÷</Button>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button onClick={() => inputNumber(7)}>7</Button>
          <Button onClick={() => inputNumber(8)}>8</Button>
          <Button onClick={() => inputNumber(9)}>9</Button>
          <Button variant="operator" onClick={() => performOperation('×')}>×</Button>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button onClick={() => inputNumber(4)}>4</Button>
          <Button onClick={() => inputNumber(5)}>5</Button>
          <Button onClick={() => inputNumber(6)}>6</Button>
          <Button variant="operator" onClick={() => performOperation('-')}>-</Button>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button onClick={() => inputNumber(1)}>1</Button>
          <Button onClick={() => inputNumber(2)}>2</Button>
          <Button onClick={() => inputNumber(3)}>3</Button>
          <Button variant="operator" onClick={() => performOperation('+')}>+</Button>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button variant="function" onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(val * 1000));
            setWaitingForOperand(true);
          }}>×1K</Button>
          <Button onClick={() => inputNumber(0)}>0</Button>
          <Button onClick={inputDecimal}>.</Button>
          <Button variant="equals" onClick={performEquals}>=</Button>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-3">
          <Button variant="function" onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(val * 1000000));
            setWaitingForOperand(true);
          }}>×1M</Button>
          <Button variant="function" onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(val * 1000000000));
            setWaitingForOperand(true);
          }}>×1B</Button>
          <Button variant="operator" onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(Math.sqrt(val)));
            setWaitingForOperand(true);
          }}>√</Button>
          <Button variant="operator" onClick={() => {
            const val = parseFloat(display);
            setDisplay(String(-val));
            setWaitingForOperand(true);
          }}>±</Button>
        </div>
      </div>

      {/* Footer - Compact for mobile */}
      <div className={`text-xs mt-3 md:mt-6 text-center transition-all duration-300 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div className="mb-1">
          <span className="hidden md:inline">IBC Tool v2.5 | Multi-Tab Financial Modeling Suite</span>
          <span className="md:hidden">IBC Tool v2.5</span>
        </div>
        {activeTab === 'forex' && ratesLastUpdated && (
          <div className={`mt-1 text-center text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            <span className="hidden md:inline">🌐 Live rates | Updated: {ratesLastUpdated.toLocaleDateString()} at {ratesLastUpdated.toLocaleTimeString()}</span>
            <span className="md:hidden">🌐 Rates updated: {ratesLastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IBCtool;
