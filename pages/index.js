import Head from 'next/head'
import Image from 'next/image'
import Board from '../components/Board'


export default function Home() {
  return (
    <div className='flex  items-center justify-center h-screen '>
      <Board/>
    </div>
  )
}
