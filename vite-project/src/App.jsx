import { useState, useEffect } from 'react'
import './App.css'
import {ethers, toBigInt} from 'ethers'
import {abi, toNumber, colors} from './config' 

const contractAddress = {
  'polygon': '0x2b3291ADBe63A94C3befaaa3645bC646d962EcCa',
  'goerli': '0x1B86aAA637AeC2fe541Ed64d26aA4D0698605D09'
}
let provider, signer, contract

function App() {

  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(contractAddress['goerli'], abi, provider)


  const [userAddress, setUserAddress] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [display, setDisplay] = useState('block')
  const [finalWord, setFinalWord] = useState('')
  let word = ''
  const [error, setError] = useState('')

  async function init(e) {
    if(e) e.preventDefault()

    if(window.ethereum == null) {
      alert('Browser wallet not installed')
      throw 'Browser wallet not installed'
    }

    await provider.send("eth_requestAccounts", [])
    signer = await provider.getSigner()
    contract = new ethers.Contract(contractAddress[document.getElementById('network').value], abi, provider)


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
    //console.log(player, guess, result, attempts)
    handleEvent(player, guess, result, attempts)
  });

  async function enforceNetwork(current) {
    const network = document.getElementById('network').value;
    if(network === 'polygon') {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x89"
        }]
      });
    } else if(network === 'goerli') {
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
    if(e) e.preventDefault()
    await init()
    try{
      const wrd = finalWord.toLowerCase()
      let nums = []
      for(let i = 0; i < wrd.length; i++) {
        nums.push(toNumber.indexOf(wrd[i]))
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

  // addEventListener('keydown', ({code}) => {
  //   word = finalWord
  //   function lock () {
  //     if(word.length === 5) {
  //       return true 
  //     } else {
  //       return false 
  //     }
  //   }
  
  //   if(lock()) return
  //   console.log(code)
  //   console.log(word.length)
  //   if(code == 'Backspace') {
  //     let w = word.slice(0, word.length - 1)
  //     setWord(w)
  //   }

  //   if(word.length < 5 && code.includes('Key') && !lock()) {
  //     console.log(word.length)
  //     // let w = word
  //     // w += code.slice(3, code.length)
  //     setWord(finalWord + code.slice(3, code.length).toLowerCase())
  //   }
  //   if(code == 'Enter') {
  //     guess()
  //   }
  // })

  // const [text, setText] = useState('');

  // useEffect(() => {
  //   document.addEventListener('keypress', handleKeyPress);
  //   return () => {
  //     document.removeEventListener('keypress', handleKeyPress);
  //   };
  // }, []);

  // const handleKeyPress = (event) => {
  //   const keyPressed = event.key;
  //   if (text.length < 5 && /^[a-zA-Z]+$/.test(keyPressed)) {
  //     setText(text + keyPressed);
  //   }
  // };

  return (
    <div className="App">
      <div>
        <h1 style={{marginTop: '-100%', color: 'whitesmoke'}}>WORDL3</h1>
        <p style={{color: 'whitesmoke'}}>Select a network to play on</p>
        <select id='network' defaultValue='goerli' onChange={e => init(e)}>
          <option value='goerli'>Goerli</option>
          <option value='polygon'>Polygon</option>
        </select>
        <span style={{color: 'red'}}>{error}</span>

      </div>
      <div dangerouslySetInnerHTML={{__html: outputHTML}}></div>
      <div className="card">
        <form onSubmit={(e) => guess(e)}>
          <br/><div style={{color: 'white'}}>{finalWord.toUpperCase()}</div><br/>
          <input type='text' id='word' onChange={() => setFinalWord(document.getElementById('word').value)} maxLength="5"></input>
          <br/><button type='submit'>Submit</button>
        </form>
      </div>
      
    </div>
  )
}

export default App
