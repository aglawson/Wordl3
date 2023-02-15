import { useState } from 'react'
import './App.css'
import {ethers, toBigInt} from 'ethers'
import {abi, toNumber, colors} from './config' 

const contractAddress = '0x1e6b0A6DF08602C6039f030cC4D89C44495A7bf1'
let provider, signer, contract

function App() {
  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(contractAddress, abi, provider)

  const [userAddress, setUserAddress] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [display, setDisplay] = useState('block')

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
    }

    html += `<br/>`
    setOutputHTML(html)
    document.getElementById('outputHTML').innerHTML = outputHTML

  
    if(instances(res, 1) === 5) {
      alert(`You won on attempt ${attempts}`)
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

  async function guess() {
    await init()

    const word = document.getElementById('word').value
    let nums = []
    for(let i = 0; i < word.length; i++) {
      nums.push(toNumber.indexOf(word[i]))
    }
    console.log(nums)
    const tx = await contract.connect(signer).guess(nums, {value: 0})
    await tx.wait(5)
    console.log(tx)
  }

  return (
    <div className="App">
      <div>
        {/* <h1 style={{marginTop: '-100%'}}>WORDL3</h1> */}
      </div>
      <div dangerouslySetInnerHTML={{__html: outputHTML}}></div>
      {/* <span style={{backgroundColor: 'red'}}>W</span>
      <span style={{backgroundColor: 'green'}}>O</span>
      <span style={{backgroundColor: 'yellow'}}>R</span>
      <span style={{backgroundColor: 'black'}}>D</span> */}
      <div className="card">
      <input type='text' placeholder='5 Letter Word. . .' id='word'></input>
      <button onClick={() => guess()}>Submit</button>
      </div>
      <button onClick={() => init()} style={{display: display}}>Connect Wallet</button>
      
    </div>
  )
}

export default App
