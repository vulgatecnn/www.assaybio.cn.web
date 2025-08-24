/**
 * 防抖函数 - 延迟执行函数，在指定时间内只执行最后一次调用
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined

  return function(this: any, ...args: Parameters<T>) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // 设置新的定时器
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数 - 限制函数执行频率，在指定时间内最多执行一次
 * @param fn 要执行的函数
 * @param interval 间隔时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function(this: any, ...args: Parameters<T>) {
    const currentTime = Date.now()
    
    if (currentTime - lastTime >= interval) {
      lastTime = currentTime
      fn.apply(this, args)
    }
  }
}