import type { NextPage } from 'next'
import Link from 'next/link'

const Home: NextPage = () => {
  return (
    <div className='flex bg-stone-800 h-screen flex-col justify-center items-center'>
      <div className='relative'>
        <img className='w-64 h-64 rounded-full' src="https://avatars.githubusercontent.com/u/26515725?v=4" alt="" />
        <a className='absolute bottom-2 right-1 translate-x-1/2 mt-4 text-lg' style={{ color: '#B5AFD0' }} href="https://github.com/xue1206">TaterBomb</a>
      </div>
      <div className='mt-4'>
        <Link href="/note"><a className="flex justify-center items-center w-32 h-10 rounded border-solid border-2" style={{ borderColor: '#B5AFD0', color: '#B5AFD0' }}>note</a></Link>
        <a className="mt-4 flex justify-center items-center w-32 h-10 rounded border-solid border-2" style={{ borderColor: '#B5AFD0', color: '#B5AFD0' }} href="https://github.com/xue1206">github</a>
      </div>
    </div>
  )
}

export default Home
