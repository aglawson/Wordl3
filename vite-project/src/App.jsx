import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ethers } from 'ethers'
import {abi, toNumber, colors, wordList} from './config'
import { TwitterShareButton, TwitterIcon } from 'react-share';

const contractAddress = {
  'polygon': '0x498679E45bbc1Ca23f3D321abAF3526ebBe59696'
}
let provider, signer, contract = null

function App() {
  const [userAddress, setUserAddress] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [finalWord, setFinalWord] = useState([])
  //const [att, setAtt] = useState([])
  const [userMessage, setUserMessage] = useState(`Begin typing when you're ready 🤓`)
  //const [displayOS, setDisplayOS] = useState('none')
  const attempts = useRef([])
  const htmlRef = useRef(outputHTML)
  const accountedRef = useRef([])
  const inputRef = useRef(null);

  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(contractAddress['polygon'], abi, provider)
  
  let initialized = false

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleBlur = () => {
    inputRef.current.focus();
  };

  useEffect(() => {
    if(!initialized) {
      console.log('init')
      init()
      initialized = true
    }
  }, []); 

  async function getHistoric(e) {
    if(e)e.preventDefault()

    if(userAddress === '') await init();
    let filter = contract.filters.guessed(await signer.getAddress())
    let events = await contract.queryFilter(filter)
    let endTime = parseInt(await contract.endTime())
    let startTime = endTime - 86400
    
    for(let i = 0; i < events.length; i++) {
      let block = await provider.getBlock(events[i].blockHash)
      if(block.timestamp > startTime) {
        handleEvent(events[i].args[1], events[i].args[2], e ? e : undefined)
      }
    }
  }

  async function init(e) {
    if(e) e.preventDefault()

    if(window.ethereum == null) {
      setUserMessage('Browser wallet not installed ☠️')
      return;
      //alert('Browser wallet not installed')
      //throw 'Browser wallet not installed'
    }

    await provider.send("eth_requestAccounts", [])
    signer = await provider.getSigner()
    contract = new ethers.Contract(contractAddress['polygon'], abi, provider)

    await enforceNetwork((await provider.getNetwork()).chainId)

    setUserAddress(await signer.getAddress())
    getHistoric(e)
  }

  function handleEvent(guess, result, e) {
    //if(e) e.preventDefault()
    let html = outputHTML

    if(accountedRef.current.includes(guess.toString())) return
    accountedRef.current.push(guess.toString())
    for(let i = 0; i < result.length; i++) {
      let value = parseInt(result[i])
      attempts.current.push({guess: toNumber[guess[i]], result: value})
      html += `<span class='card' style="background-color: ${colors[value]}; padding-right: 2.5%; padding-left: 2.5%; border: 1px; font-size: 200%;">${toNumber[guess[i]]}</span>`
    }
    //setAtt(attempts.current)
    
    html += `<br/>`
    if(!htmlRef.current.includes(html)){
      htmlRef.current += html
      setOutputHTML(htmlRef.current)
    }

    if(instances(result, '1') === 5) {
      setUserMessage(`You Won!! 🥳`)
    } else {
      setUserMessage(`Transaction complete! Your results should show below 👇`)
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
  contract.on("guessed",async (player, guess, result) => {
    if(player === await signer.getAddress()) {
      getHistoric()
    }
    //handleEvent(guess, result)
  });

  async function enforceNetwork() {
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
      let wrd = ''
      for(let i = 0; i < finalWord.length; i++) {
        wrd += finalWord[i].value.toLowerCase()
      }
      
      // if(!wordList.includes(wrd)) {
      //   setUserMessage('Word not in word list')
      //   return
      // }
      let nums = []
      for(let i = 0; i < wrd.length; i++) {
        nums.push(toNumber.indexOf(wrd[i]))
      }
      const tx = await contract.connect(signer).guess(nums)
      setUserMessage(`Checking your answer on the blockchain 🤔`)
      await tx.wait(1)
      if(userMessage != `You Won!! 🥳`) {
        
      }
    } catch(error) {
      if(error.message.includes('(')) {
        let message = error.message
        let index = message.indexOf('(')
        message = message.substr(0, index)
        setUserMessage(message + '😿')
      } else {
        setUserMessage(error.message + '😿')
      }
    }
  }

  function handleTyping() {
    let current = document.getElementById('word').value
    let temp = []
    for(let i = 0; i < current.length; i++) {
      const result = attempts.current.find((obj) => obj.guess === current[i]);
      let color
      if(result) {
        color = result.result
      }
      temp.push({value: current[i], result: color !== 0 ? 3 : 0 })
    }

    setFinalWord(temp)
  }
  function handlePaste(e) {
    e.preventDefault();
  };

  if(useMobile() && initialized) {
    const input = document.getElementById('word');
    input.focus();
  }

  function useMobile() {
    if(window.innerWidth < 800) {
      return true
    } else {
      return false
    }
  }
  
  return (
    <div className="App">
      <div>
        <h1 className='text-glow' style={{color: 'blueviolet', backgroundImage: './ape.png'}}>3RDLE</h1>
        <p style={{color: 'whitesmoke'}}>Guess the 5 letter word of the day in 6 tries or less!</p>
        <h3 style={{color: 'blueviolet'}}>{userMessage}</h3>
        <h4 style={{color: 'blueviolet'}}><a href='https://opensea.io/account' target='_bank'>{userMessage === 'You Won!! 🥳' ? 'View your prize on Opensea' : ''}</a></h4>
        {/* <span style={{color: 'red'}}>{error}</span><span style={{color: 'red'}} onClick={() => setError('')}>{error != '' ? '   x' : ''}</span> */}
        <TwitterShareButton
          url={'https://www.3rdle.xyz'}
          title={`I guessed the 3rdle word of the day in ${attempts.current.length / 5} tries and got a free NFT! Try to beat me -> `}
          hashtags={['3rdle', 'nft', 'web3game', 'polygon', 'freenft', 'nftgame']}
          style={{display: userMessage == `You Won!! 🥳` ? 'block' : 'none', justifyContent: 'center', marginLeft: '48.75%'}}
          >
            <TwitterIcon size={32} round />
        </TwitterShareButton>
        <div className={useMobile() ? 'wordMobile glow' : 'word glow'}>
        {/* dangerouslySetInnerHTML={{__html: htmlRef.current}} */}
          {attempts.current.map((item, index) => (
            <p className={useMobile() ? 'cardMobile btn-glow' : 'card btn-glow'} style={{background: colors[item.result]}} key={index}>{item.guess.toUpperCase()}</p>
          ))}
        </div>
        <div className={useMobile() ? 'wordMobile glow' : 'word glow'}>
          {finalWord.map((item, index) => (
            <p className={useMobile() ? 'cardMobile btn-glow' : 'card btn-glow'} style={{background: colors[item.result]}} key={index}>{item.value.toUpperCase()}</p>
          ))}
          
        </div>
        {/* <h2 className='text-glow'>{finalWord}</h2> */}

      </div> 
      <div className='bottom-element'>
        <form onSubmit={(e) => guess(e)}>
          <br/><button className='btn btn-gradient-border btn-glow' type='submit'>Submit</button>
          <button className='btn btn-gradient btn-glow' onClick={e => init(e)}>Connect</button><br/>
          <br/>

          <input type='text' id='word' onChange={() => handleTyping()} onPaste={(e) => handlePaste(e)} maxLength="5" ref={inputRef} onBlur={handleBlur}></input>
        </form>
      </div>
    </div>
  )
}

export default App
