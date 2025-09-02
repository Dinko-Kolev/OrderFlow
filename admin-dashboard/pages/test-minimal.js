import { useState, useEffect } from 'react';

export default function TestMinimal() {
  const [count, setCount] = useState(0);
  
  console.log('🔵 Component rendering, count:', count);
  
  // Try immediate state update
  if (count === 0) {
    console.log('🟡 Setting count to 1');
    setCount(1);
  }
  
  useEffect(() => {
    console.log('🟢 useEffect running!');
  }, []);
  
  return (
    <div className="p-8">
      <h1>Minimal Test</h1>
      <p>Count: {count}</p>
    </div>
  );
}
