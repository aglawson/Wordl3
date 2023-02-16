import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ethers } from 'ethers'
import {abi, toNumber, colors} from './config' 

const contractAddress = {
  'polygon': '0x2b3291ADBe63A94C3befaaa3645bC646d962EcCa',
  'goerli': '0x1B86aAA637AeC2fe541Ed64d26aA4D0698605D09'
}
let provider, signer, contract

function App() {

  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(contractAddress['polygon'], abi, provider)
  const [userAddress, setUserAddress] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [finalWord, setFinalWord] = useState('')
  const [error, setError] = useState('')

  const htmlRef = useRef(outputHTML)
  const accountedRef = useRef([])

  async function getHistoric(e) {
    if(e)e.preventDefault()
    let filter = contract.filters.guessed(await signer.getAddress())
    let events = await contract.queryFilter(filter)
    let endTime = parseInt(await contract.endTime())
    let startTime = endTime - 86400
    
    for(let i = 0; i < events.length; i++) {
      let block = await provider.getBlock(events[i].blockHash)
      if(block.timestamp > startTime) {
        handleEvent(events[i].args[1], events[i].args[2], e ? e : '')
      }
    }
  }

  async function init(e) {
    if(e) e.preventDefault()

    if(window.ethereum == null) {
      alert('Browser wallet not installed')
      throw 'Browser wallet not installed'
    }

    await provider.send("eth_requestAccounts", [])
    signer = await provider.getSigner()
    contract = new ethers.Contract(contractAddress['polygon'], abi, provider)

    await enforceNetwork((await provider.getNetwork()).chainId)

    setUserAddress(await signer.getAddress())
    getHistoric(e)
  }

  function handleEvent(guess, result, e) {
    if(e) e.preventDefault()
    let html = outputHTML

    if(accountedRef.current.includes(guess.toString())) return
    accountedRef.current.push(guess.toString())
    for(let i = 0; i < result.length; i++) {
      let value = parseInt(result[i])

      html += `<span style="background-color: ${colors[value]}; padding-right: 2.5%; padding-left: 2.5%; border: 1px; font-size: 200%;">${toNumber[guess[i]]}</span>`
    }
    html += `<br/>`
    if(!htmlRef.current.includes(html)){
      htmlRef.current += html
      setOutputHTML(htmlRef.current)
    }
  }

  function instances(arr, value) {
    let count = 0
    for(let i = 0; i < arr.length; i++) {
      if(arr[i] == value) {
        count++
      }
    }

    return count
  }

  // Begin listening for event
  contract.on("guessed", (player, guess, result) => {
    //getHistoric()
    handleEvent(guess, result)
  });

  async function enforceNetwork(current) {
    const network = (await provider.getNetwork()).chainId
    if(network !== 137) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x89"
        }]
      });
    } 
  }

  async function guess(e) {
    if(e) e.preventDefault()
    signer = await provider.getSigner()

    try{
      const wrd = finalWord.toLowerCase()
      let nums = []
      for(let i = 0; i < wrd.length; i++) {
        nums.push(toNumber.indexOf(wrd[i]))
      }
      const tx = await contract.connect(signer).guess(nums)
    } catch(error) {
      if(error.message.includes('(')) {
        let message = error.message
        let index = message.indexOf('(')
        message = message.substr(0, index)
        setError(message)
      } else {
        setError(error.message)
      }
    }
  }
  
  return (
    <div className="App">
      <div>
        <h1 style={{color: 'whitesmoke'}}>WORDL3</h1>
        <p style={{color: 'whitesmoke'}}>Guess the 5 letter word of the day in 6 tries or less!</p>
        <span style={{color: 'red'}}>{error}</span><span style={{color: 'red'}} onClick={() => setError('')}>{error != '' ? '   x' : ''}</span>
        <div dangerouslySetInnerHTML={{__html: htmlRef.current}}></div>
      </div>
      <div>

      </div>
      <div className="card">
        <form onSubmit={(e) => guess(e)}>
          <br/><div style={{color: 'white'}}>{finalWord.toUpperCase()}</div><br/>
          <input type='text' id='word' onChange={() => setFinalWord(document.getElementById('word').value)} maxLength="5"></input>
          <br/><button type='submit'>Submit</button>
          <br/><button onClick={e => init(e)}>Login</button>
        </form>
      </div>
      
    </div>
  )
}

export default App
