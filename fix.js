const fs = require('fs');
const path = 'C:/Users/topet/ghostmeter/src/app/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Replace ScoreCircle with animated version
const oldSC = `function ScoreCircle({ score, label, icon, color }: { score: number; label: string; icon: string; color: string }) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="45" fill="none" stroke="#e5e5e5" strokeWidth="8" />
          <circle cx="48" cy="48" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(score)}%</span>
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <span className="mt-1 text-sm text-gray-500">{label}</span>
    </div>
  )
}`;

const newSC = `function ScoreCircle({ score, label, icon, color, isDominant }: { score: number; label: string; icon: string; color: string; isDominant?: boolean }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    setAnimatedScore(0)
    const duration = 1500
    const startTime = Date.now()
    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setAnimatedScore(score * eased)
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, 200)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className={\`flex flex-col items-center transition-transform duration-500 \${isDominant ? 'scale-110' : ''}\`}>
      <div className="relative w-24 h-24" style={isDominant ? { filter: \`drop-shadow(0 0 15px \${color}88)\` } : {}}>
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r="45" fill="none" stroke="#e5e5e5" strokeWidth="8" />
          <circle cx="48" cy="48" r="45" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{Math.round(animatedScore)}%</span>
          <span className="text-base">{icon}</span>
        </div>
      </div>
      <span className={\`mt-1 text-sm \${isDominant ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-500'}\`}>{label}</span>
    </div>
  )
}`;

if (c.includes(oldSC)) {
  c = c.replace(oldSC, newSC);
  console.log('OK Step 1: ScoreCircle animated');
} else { console.log('FAIL Step 1: ScoreCircle not found'); }

// 2. Add Confetti component before Auth Modal
const confetti = `
function Confetti() {
  const colors = ['#a855f7', '#ec4899', '#22c55e', '#f97316', '#3b82f6', '#eab308']
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: colors[i % colors.length],
    size: Math.random() * 8 + 4,
    duration: Math.random() * 2 + 1.5,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{\`@keyframes confetti-fall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }\`}</style>
      {pieces.map((p, i) => (
        <div key={i} className="absolute" style={{
          left: p.left + '%',
          top: '-10px',
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          borderRadius: i % 2 === 0 ? '50%' : '0',
          animation: 'confetti-fall ' + p.duration + 's ease-out ' + p.delay + 's forwards',
        }} />
      ))}
    </div>
  )
}

// Auth Modal`;

if (c.includes('// Auth Modal')) {
  c = c.replace('\n// Auth Modal', confetti);
  console.log('OK Step 2: Confetti component added');
} else { console.log('FAIL Step 2: Auth Modal not found'); }

// 3. Add isDominant to ScoreCircle calls
c = c.replace("color='#22c55e' />", "color='#22c55e' isDominant={analysis.interestScore >= analysis.manipulationScore && analysis.interestScore >= analysis.ghostingScore} />");
console.log('OK Step 3a: Interest isDominant');

c = c.replace("color='#f97316' />", "color='#f97316' isDominant={analysis.manipulationScore > analysis.interestScore && analysis.manipulationScore >= analysis.ghostingScore} />");
console.log('OK Step 3b: Manipulation isDominant');

c = c.replace("color='#ef4444' />", "color='#ef4444' isDominant={analysis.ghostingScore > analysis.interestScore && analysis.ghostingScore > analysis.manipulationScore} />");
console.log('OK Step 3c: Ghosting isDominant');

// 4. Confetti trigger when positive (low ghosting + manipulation)
c = c.replace('<div className="max-w-lg mx-auto">', '<div className="max-w-lg mx-auto">{analysis.ghostingScore < 30 && analysis.manipulationScore < 30 && <Confetti />}');
console.log('OK Step 4: Confetti trigger');

fs.writeFileSync(path, c, 'utf8');
console.log('\nAll done!');
