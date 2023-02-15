import { useState } from 'react'
import './App.css'
import {ethers, toBigInt} from 'ethers'
import {abi, toNumber, colors} from './config' 

const contractAddress = '0xC0a801997Ff1444D1bB7CfE925BF7d8BBfF7Cc5f'
let provider, signer, contract

function App() {
  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(contractAddress, abi, provider)

  const [userAddress, setUserAddress] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [display, setDisplay] = useState('block')
  const [word, setWord] = useState('')
  const [error, setError] = useState('')

  async function init(e) {
    if(e) e.preventDefault()

    if(window.ethereum == null) {
      alert('Browser wallet not installed')
      throw 'Browser wallet not installed'
    }

    await provider.send("eth_requestAccounts", [])
    signer = await provider.getSigner()

    await enforceNetwork((await provider.getNetwork()).chainId)

    setUserAddress(await signer.getAddress())
    setDisplay('none')
    //await getPastResults()
  }

  function handleEvent(player, guess, result, attempts) {
    let html = outputHTML

    let res = [];
    for(let i = 0; i < result.length; i++) {
      let value = parseInt(result[i])
      console.log(value)
      res.push(value)

      html += `<span style="background-color: ${colors[value]}; padding-right: 2.5%; padding-left: 2.5%; border: 1px; font-size: 200%;">${toNumber[guess[i]]}</span>`
      //setOutputHTML(html)
      
      setTimeout(setOutputHTML(html),1000 + (1000 * i))
    }

    html += `<br/>`
    //setOutputHTML(html)
    //document.getElementById('outputHTML').innerHTML = outputHTML

  
    if(instances(res, 1) === 5) {
      //alert(`You won on attempt ${attempts}`)
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
  contract.on("guessed", (player, guess, result, attempts, won) => {
    console.log(player, guess, result, attempts)
    handleEvent(player, guess, result, attempts)
  });

  async function getPastResults() {
    // Query all time for any transfer to ethers.eth
    // let filter = contract.filters.guessed(userAddress)
    // let events = await contract.queryFilter(filter)
    // console.log(events)
    // Calculate the timestamp for 24 hours ago
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - 24 * 60 * 60;
    let tfha = ethers.encodeBytes32String(twentyFourHoursAgo.toString())
    // Create a filter for events emitted in the last 24 hours
    const filter = {
      address: contractAddress,
      fromBlock: 0,
      toBlock: "latest",
      topics: [],
      blockhash: null,
    };

    // Add a filter for the timestamp of the event
    const eventName = "guessed";
    const eventTopic = ethers.id(eventName);
    filter.topics.push(eventTopic);
    filter.topics.push(null);
    filter.topics.push(ethers.zeroPadBytes(tfha, 32));
    
    // Retrieve the events that match the filter
    const events = await contract.queryFilter("guessed");
    console.log(events);
  }

  async function enforceNetwork(current) {
    if(parseInt(current) != 5) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x5"
        }]
      });
    }
  }

  // function toNumber(word) {
  //   let nums = []

  //   for(let i = 0; i < 5; i++) {
  //     nums.push(toNumber[word[i]])
  //   }
    
  //   return nums
  // }

  async function guess(e) {
    e.preventDefault()
    await init()
    try{
      const word = document.getElementById('word').value.toLowerCase()
      let nums = []
      for(let i = 0; i < word.length; i++) {
        nums.push(toNumber.indexOf(word[i]))
      }
      console.log(nums)
      const tx = await contract.connect(signer).guess(nums, {value: 0})
      //await tx.wait(5)
      console.log(tx)
    } catch(error) {
      console.log(error.message)
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
        <h1 style={{marginTop: '-100%', color: 'whitesmoke'}}>WORDL3</h1>
        <span style={{color: 'red'}}>{error}</span>

      </div>
      <div dangerouslySetInnerHTML={{__html: outputHTML}}></div>
      <div className="card">
        <form onSubmit={(e) => guess(e)}>
          <input type='text' placeholder='5 Letter Word. . .' id='word'></input><br/>
          <button type='submit'>Submit</button>
        </form>
      </div>
      
    </div>
  )
}

export default App
