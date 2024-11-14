/*

Aiden Swann
UID: 2132118
Date 2/20/2021

encrypt.js is an interactive webpage that allows an user to encrypt text

*/


"use strict";
(function () {

  window.addEventListener("load", init);
  
  /**
     * Sets up the page with necessary event listeners. Encrypts text
     * when the encrypt button is pressed
    */
  function init() { 

    // callback for encrypt button
    document.getElementById("encrypt").addEventListener("click", generateCipher)
    // callback for reset button
    document.getElementById("reset").addEventListener("click", reset)
    // callback for all-caps button
    document.getElementById("all-caps").addEventListener("change", caps)
    // callback for text-size bullet
    document.getElementsByName("text-size")[0].addEventListener("change", changeFont)
    document.getElementsByName("text-size")[1].addEventListener("change", changeFont)
   
  }

  /**
   * shifts input text by 1 char value accounting for overflows at the end of the 
   * alphabet
   *
   * @param {String} text - input text to encode with a single-letter shift cipher
   * @return {String} - encoded text, maintaining letter-casing and ignoring 
   * non-alphabetical characters.
   */
  function shiftCipher(text) { 

    // initialize variables
    let n, i, output
    
    // n must equal one for below implementation to work
    n = 1
    output = ""
    // main loop to iterate through letters in word
    for(i = 0; i < text.length; i++) {
      // if the character is a letter
      if(text.charCodeAt(i) <= 'z'.charCodeAt(0) && text.charCodeAt(i) >= 'A'.charCodeAt(0)){
        // shift z to a
        if(text.charAt(i) === 'z' || text.charAt(i) === 'Z') {
          output += String.fromCharCode(text.charCodeAt(i) - 25)
        }
        // add one to the value of the character
        else {
          output += String.fromCharCode(text.charCodeAt(i) + n)
        }
      }
      // if the character is a number
      else if (text.charCodeAt(i) <= '9'.charCodeAt(0) && text.charCodeAt(i) >='0'.charCodeAt(0)){
        // shift 9 to 0
        if(text.charAt(i) == '9') {
          output += String.fromCharCode(text.charCodeAt(i) - 9)
        }
        // add one to the value of the character
        else {
          output += String.fromCharCode(text.charCodeAt(i) + n)
        }
      }
      // if neither number or letter, do not shift
      else {
        output += text.charAt(i)
      }
    }
    return output

  }

  /**
   * converts input text into emojis 
   *
   * @param {String} text - input text to encode 
   * @return {String} - encoded text, maintaining letter-casing and 
   * ignoring non-alphabetical characters.
   */
  function customCipher(text) {
    
    // the start of emojis in UNICODE
    const emojiOffset = 127750
    let i, output
    output = ""
    // main loop to iterate through letters in word
    for(i = 0; i < text.length; i++) {
      let charCode = text.charCodeAt(i)
      // if the character is a letter
      if(charCode <= 'z'.charCodeAt(0) && charCode >= 'A'.charCodeAt(0)){
        // shift the unicode character to the emoji range
        output += String.fromCodePoint(charCode-65 + emojiOffset + 10)
      }
      // if the character is a number
      else if (charCode <= '9'.charCodeAt(0) && charCode >= '0'.charCodeAt(0)) {
        // shift the unicode character to the emoji range
        output += String.fromCodePoint(charCode-48 + emojiOffset)
      }
      // if neither number or letter, do not shift
      else {
        output += text.charAt(i)
  
      }
    }
    return output
  }

  /**
   * get values from "input-text" and preforms cipher specified in the 
   * "cipher-type" box, outputting to "result"
   */

  function generateCipher() { 

    // initialize variables 
    let val, cipher, output

    // get input text
    val = document.getElementById("input-text").value
    // get cipher type
    cipher = document.getElementById("cipher-type").value
    // if shift cipher is selected
    if(cipher == "shift") {
      // call shiftcipher function and set result to its value
      output = shiftCipher(val)
      document.getElementById("result").textContent = output
    }
    // if emoji cipher is selected
    else if (cipher == "emoji") {
      // call customcipher function and set result to its value
      output = customCipher(val)
      document.getElementById("result").textContent = output
    }
    
  }

  /**
   * reset the "result" and "input-text" to empty strings
   */
  function reset() {
    document.getElementById("result").textContent = ""
    document.getElementById("input-text").value = ""

  }


  /**
   * updates the capitalization of the "result" box if "all-caps" is 
   * checked or unchecked 
   */
  function caps() {
    let cap = document.getElementById("all-caps").checked
    // if checked set "result" to uppercase
    if(cap) {
      document.getElementById("result").classList.add("uppercase")
    }
    // if unchecked remove "result" from uppercase
    else {
      document.getElementById("result").classList.remove("uppercase")
    }
  }

  /**
   * updates the font of the "result" box depending on the state of
   * the font bullet buttons 
   */
  function changeFont() {
    //set the fontsize to the value of the button on the callback function
    id("result").style.fontSize = this.value
  }
  /* Helper Functions */
  function id(idName) {
    return document.getElementById(idName);
  }

  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  function qs(selector) {
    return document.querySelector(selector);
  }

  function isLowerCaseLetter(c) {
    return c >= 'a' && c <= 'z';
  }

})();
