import React, { useState }from 'react';
import logo from './logo.svg';
import './App.css';

const getTournamentSettings = (tournamentId) => `https://matchplay.events/data/tournaments/${encodeURIComponent(tournamentId)}`
const getMachineResults = (tournamentId, arenaId) => `https://matchplay.events/data/tournaments/${encodeURIComponent(tournamentId)}/arenas/${encodeURIComponent(arenaId)}/scores`
const defaultTournamentId = 'opwnov2019'
const playersById = {}

function App() {
  const [tournamentId, setTournamentId] = useState(defaultTournamentId)
  const [validGames, setValidGames] = useState(null)
  const [tournamentSettings, setTournamentSettings] = useState(null)
  const [gameResults, setGameResults] = useState({})

  const handleInput = (event) => {
    console.log(event.keyCode)
    setTournamentId(event.target.value)
  }

  const checkForEnter = (event) => {
    if (event.keyCode === 13) {
      lookupTournament()
    }
  }

  const requestGameData = (game) => {
    window.fetch(getMachineResults(tournamentId, game.arena_id)).then(response => {
      if (response.status === 200) {
        return response.json()
      } else {
        alert('something went wrong, i dunno, check the console')
        console.log(response)
        throw 'error'
      }
    }).then(gameData => {
      console.log(gameData)
      console.log(gameResults)
      setGameResults(oldResults => {
        return {...oldResults, [game.arena_id]: gameData}
      })
    })
  }

  const lookupTournament = () => {
    console.log(tournamentId)
    window.fetch(getTournamentSettings(tournamentId)).then(response => {
      if (response.status === 200) {
        return response.json()
      } else {
        alert('something went wrong, i dunno, check the console')
        console.log(response)
        throw 'error'
      }
    }).then(data => {
      console.log(data)
      setTournamentSettings(data)

      data.players.forEach(player => {
        playersById[player.player_id] = player
      })

      const validGames = data.arenas.filter(arena => arena.tournament.status === 'active')
        .sort((a, b) => {
          if (a.name > b.name) {
            return 1
          } else {
            return -1
          }
        })
      setValidGames(validGames)
      console.log(validGames)
      validGames.forEach(requestGameData)
    })
  }
  let gameResultsDisplay = null
  if (validGames) {
    gameResultsDisplay = validGames.map(game => {
      const resultsData = gameResults[game.arena_id]
      let top3 = null
      if (resultsData) {
        top3 = resultsData.slice(0, 3).map((result, index) => {
          if (!playersById[result.player_id]) {
            debugger
          }
          return <tr key={result.game_id}><td>#{index + 1} {playersById[result.player_id].name}</td><td style={{ paddingLeft: '1em'}}>{result.score.toLocaleString()}</td></tr>
        })
      }
      return <div key={game.arena_id} className='table'>
        {game.name}
        <table><tbody>{top3}</tbody></table>
      </div>
    })
    console.log(gameResults)
  }
  return (
    <div className="App">
      <div>
        <input type="text" value={tournamentId} onChange={handleInput} onKeyUp={checkForEnter} />
        <input type="button" value='lookup' onClick={lookupTournament} />
      </div>
      {gameResultsDisplay}
    </div>
  );
}

export default App;
