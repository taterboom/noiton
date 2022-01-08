import { useRef, useState } from "react"

const useLoading = (initialValue: boolean = false) => {
  const [loading, setLoading] = useState(initialValue)
  const withLoading = useRef(async function<T extends any>(promise: Promise<T>) {
    setLoading(true)
    const res = await promise
    setLoading(false)
    return res
  })
  return [loading, withLoading.current, setLoading] as const;
}

export default useLoading