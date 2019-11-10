import React, { useState }from 'react';
import forkme from './forkme.png';
import './App.css';

const getTournamentSettings = (tournamentId) => `https://matchplay.events/data/tournaments/${encodeURIComponent(tournamentId)}`
const getMachineResults = (tournamentId, arenaId) => `https://matchplay.events/data/tournaments/${encodeURIComponent(tournamentId)}/arenas/${encodeURIComponent(arenaId)}/scores`
const query = new URLSearchParams(window.location.search)
const defaultTournamentId = query.has('t') ? query.get('t') : 'opwnov2019'
const playersById = {}

function App() {
  const [tournamentId, setTournamentId] = useState(defaultTournamentId)
  const [validGames, setValidGames] = useState(null)
  const [tournamentSettings, setTournamentSettings] = useState(null)
  const [gameResults, setGameResults] = useState({})
  const [error, setError] = useState(null)

  const handleInput = (event) => {
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
        setError(`error getting game results ${JSON.stringify(response)}`)
        console.log(response)
        throw 'error'
      }
    }).then(gameData => {
      setGameResults(oldResults => {
        return {...oldResults, [game.arena_id]: gameData}
      })
    })
  }

  const lookupTournament = () => {
    window.location = `https://matchplay.events/live/${encodeURIComponent(tournamentId)}/scores?arena_id=top`
    return
    window.history.pushState(null, null, `?t=${encodeURIComponent(tournamentId)}`)
    window.fetch(getTournamentSettings(tournamentId)).then(response => {
      if (response.status === 200) {
        return response.json()
      } else {
        setError(`error getting tournament settings, are you sure the matchplay id is correct?`)

        console.log(response)
        throw 'error'
      }
    }).then(data => {
      console.log(data)
      setTournamentSettings(data)
      if (data.type !== 'best_game') {
        setError('matchplay tourney not a best game format, try a different matchplay id')
        return;
      }
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

  const checkPaste = (event) => {
    const clipboard = event.clipboardData.getData('Text')
    // should match http or https, or no protocol looking for the bit after live
    const matchplayRe = /(https?:\/\/)?matchplay.events\/live\/([^/]+)(\/.+)?/
    console.log(clipboard.match(matchplayRe))
    if (!clipboard) return
    const matches = clipboard.match(matchplayRe)
    if (matches) {
      if (matches[2]) {
        setTournamentId(matches[2])
        event.preventDefault()
        event.stopPropagation()
      }
    }
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
          return <tr key={result.game_id} style={{ color: result.status === 'pending' ? '#aaa' : null}}>
            <td>#{index + 1} {playersById[result.player_id].name}</td>
            <td style={{ paddingLeft: '1em'}}>{result.score.toLocaleString()}</td>
          </tr>
        })
      }
      return <div key={game.arena_id} className='table'>
        <a href={`https://matchplay.events/live/${tournamentId}/scores?arena_id=${game.arena_id}`}>
          {game.name}
        </a>
        <table><tbody>{top3}</tbody></table>
      </div>
    })
  }
  return (
    <div>
      <a href="https://github.com/nthitz/matchplay-all-scores" className='forkme'>
        <img width="149" height="149" src={forkme} alt="Fork me on GitHub" />
      </a>

      <div className="App">
        <div>Matchplay now does this natively, just goto the Top Scores arena, thanks Andreas!</div>
        <br /><div>
          A tool for Matchplay.events to see a list of the top scores for game in a best_game tournament at once. That is, if I wanna easily see what locations would be worthwhile visiting and if they have scores I can take down
          <br /><br />
          Enter matchplay.events id below. It's the part of the url after live/ <br />
          https://matchplay.events/live/
          <input type="text" value={tournamentId} onChange={handleInput} onKeyUp={checkForEnter} onPaste={checkPaste} />
          <input type="button" value='lookup' onClick={lookupTournament} />
        </div>

        {error ? <div className='error'>{error}</div>: null}
        {gameResultsDisplay}
      </div>
    </div>
  );
}

export default App;
