import useStore from '../../store'
import HeroCard from '../home/HeroCard'
import MainActions from '../home/MainActions'
import ChartCard from '../home/ChartCard'
import RecentTx from '../home/RecentTx'

export default function HomePage() {
  const chartsEnabled = useStore((s) => s.chartsEnabled)

  return (
    <>
      <HeroCard />
      <MainActions />
      {chartsEnabled && <ChartCard />}
      <RecentTx />
    </>
  )
}
