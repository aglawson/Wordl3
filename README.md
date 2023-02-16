# Wordl3
It's NYTimes' Wordle, but entirely on the blockchain!

Play it [here](https://wordl3-ten.vercel.app/)

## Description
* Every day at 12:00am Pacific Time, a new 5-letter word is generated and entered into the smart contract
* Your task is to guess that word in as few tries as possible
* Each guess requires an on-chain transaction on the Polygon(MATIC) network. This will cost gas fees, but usually no more than 5 cents
* Once the smart contract returns the result, you will see your letters on the screen with different colored backgrounds
    * Red: this letter is not in the word of the day
    * Yellow: this letter is in the word, but it is in the wrong place
    * Green: this letter is in the word and in the correct place
* If you don't get it right in six tries, the word will not be revealed. But no worries, try again tomorrow!