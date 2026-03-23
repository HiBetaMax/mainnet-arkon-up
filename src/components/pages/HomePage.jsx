import HeroCard from '../home/HeroCard'
import MainActions from '../home/MainActions'
import ChartCard from '../home/ChartCard'
import RecentTx from '../home/RecentTx'

export default function HomePage() {
  return (
    <>
      <HeroCard />
      <MainActions />
      <ChartCard />
      <RecentTx />
    </>
  )
}
