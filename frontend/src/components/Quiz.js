import React, {useEffect, useState, useCallback} from 'react';
import axios from 'axios';
import {useHistory, Redirect} from 'react-router-dom';
import Timer from './Timer';
import Popup from './Popup';

const Quiz = (props) => {

  const history = useHistory();
  
    const {
        category,
        difficulty,
    } = props;
   
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([false, false, false, false, false, false, false, false, false, false]);
    const [categoryName, setCategoryName] = useState("");
    const [noResults, setNoResults] = useState(false);
    const [timeTaken, setTimeTaken] = useState(0);
    const [sessionToken, setSessionToken] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [tokenChanged, setTokenChanged] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getTimeTaken = useCallback((time) => {

      setTimeTaken(time);
    }, [])

    const getSessionToken = async () => {  
      console.log('in get session token') 
      const sessionTokenResponse = await axios.get('https://opentdb.com/api_token.php?command=request');
      setSessionToken(sessionTokenResponse.data.token);
    };
  
    const updateSessionToken = async () => {
      console.log('in update session token')

      try {

        await axios.get(`https://opentdb.com/api_token.php?command=reset&token=${sessionToken}`);

      } catch (error){
          
        console.log(error)
        setNoResults(true);

      }
    };
  
    
    const getCategoryName = (catNumber) => {

        let categoryName = "";
        
        switch (catNumber){
          case "9": 
           categoryName = "General Knowledge"; 
            break;
          case "10": 
            categoryName = "Books"; 
            break;
          case "11": 
            categoryName = "Film"; 
            break;
          case "12": 
            categoryName = "Music"; 
            break;
          case "13": 
            categoryName = "Musicals and Theatres"; 
            break;
          case "14":
            categoryName = "Television";
            break;
          case "15":
            categoryName = "Video Games";
            break;
          case "16":
            categoryName = "Board Games";
            break;
          case "17":
            categoryName = "Science and Nature";
            break;
          case "18":
            categoryName = "Computers";
            break;
          case "19":
            categoryName = "Mathematics";
            break;
          case "20":
            categoryName = "Mythology";
            break;
          case "21":
            categoryName = "Sports";
            break;
          case "22":
            categoryName = "Geography"
            break;
          case "23":
            categoryName = "History";
            break;
          case "24":
            categoryName = "Politics";
            break;
          case "25":
            categoryName = "Art";
            break;
          case "26":
            categoryName = "Celebrities";
            break;
          case "27":
            categoryName = "Animals";
            break;
          case "28":
            categoryName = "Vehicles";
            break;
          case "29":
            categoryName = "Comics";
            break;
          case "30":
            categoryName = "Gadgets";
            break;
          case "31":
            categoryName = "Japanese Amime and Manga"
            break;
          case "32":
            categoryName = "Cartoon and Animation";
            break;
          default:
            categoryName = ""
        }
         
        setCategoryName(categoryName);
    }    

    const fetchQuestions  = async () => {
      console.log('in fetch questions')

        try {

          const response = await axios.get(`https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple&token=${sessionToken}`);
          return response; 

        } catch (error) {
          console.log(error)
          setNoResults(true);
        }

    }

  const decodeText = (encodedText) => {
  
    let text = document.createElement('textarea');
    text.innerHTML = encodedText;
    let decodedText = text.value;

    return decodedText;

};

    const scrambledAnswersCallBack = useCallback(
      (questions) => {

        const questionsandAnswers = questions.reduce((acc, curr, ind) => {

          let answers = [{
            answer: decodeText(curr.correct_answer),
            correct: true
          }, {
            answer: decodeText(curr.incorrect_answers[0]),
            correct: false
          }, {
            answer: decodeText(curr.incorrect_answers[1]),
            correct: false
          }, {
            answer: decodeText(curr.incorrect_answers[2]),
            correct: false
          }];

          let mixedAnswers = [];

          let num = 4;

          for (let i = 0; i < 4; i++) {

            let randInt = Math.floor(Math.random() * num);

            num--

            mixedAnswers.push(answers[randInt]);
            answers.splice(randInt, 1)

          }

          acc.push({
            number: `Question${ind}`,
            selected: false,
            question: decodeText(curr.question),
            answers: mixedAnswers
          });
          return acc;

        }, [])

        return questionsandAnswers;

      },
      []
    )

         //inside useEffect
  //const questions = fetchQuestions() (in any case)
      //Happy path
      // store questions in state
      //Sad path
      // response === 3
      // getSessionToken()
      // response === 4
      // refreshToken()
      //const questions = fetchQuestions()      
      //store questions in state
//[sessionToken]

    const getAndPrepareQuiz = async () => {

      setIsLoading(true)

      if (sessionToken) {

          const response = await fetchQuestions();
        
          if (response.data && response.data.response_code === 0) {

              let questionsAndScrambledAnswers = scrambledAnswersCallBack(response.data.results);
              setQuestions(questionsAndScrambledAnswers);
              getCategoryName(category);

              setIsLoading(false)

          } else if (response.data && response.data.response_code === 1) {

              console.log("in response code 1 if ");
              setNoResults(true);

          } else if (response.data && response.data.response_code === 2) {

              console.log("in response code 2 else if");
              setNoResults(true);

          } else if (response.data && response.data.response_code === 3) {

              console.log("in response code 3 else if ");
              getSessionToken();

          } else if (response.data && response.data.response_code === 4) {

              console.log("in response code 4 else if ");
              await updateSessionToken()

              const secondResponse = await fetchQuestions();
              console.log(secondResponse)

              if (secondResponse.data.response_code === 4) {
                setNoResults(true);
              } else {

                let questionsAndScrambledAnswers = scrambledAnswersCallBack(secondResponse.data.results);
                setQuestions(questionsAndScrambledAnswers);
                getCategoryName(category);
                setTokenChanged(!tokenChanged)  //- this causes a loop as update token not working?
                setIsLoading(false)

              }

          } 
  

      } else {
            getSessionToken();
        }
      
    } 

    const onRadioChange = (answerInd, questionInd, event) => {

      // update answers with true or false
      let correctOrIncorrect = questions[questionInd].answers[answerInd].correct;
      const answersPlaceholder = [...answers]
      answersPlaceholder.splice(questionInd, 1, correctOrIncorrect);

      // update that question selected
      const questionsPlaceholder = [...questions];
      questionsPlaceholder[questionInd].selected = true;

      // update state of questions and answers
      setQuestions(questionsPlaceholder);
      setAnswers(answersPlaceholder);
    }

    const checkAllAnswered = (array) => {

      const allChecked = array.reduce((acc, curr, ind, arr) => {

         return curr.selected ? acc + 1 : acc;

      }, 0)

      return allChecked < 10 ? false : true

    }

      const togglePopup = () => {
        setShowPopup(!showPopup)
      }

    const formHandler = async (event) => {
      console.log('in form handler')

      event.preventDefault();

      const allAnswered = checkAllAnswered(questions);
      console.log(allAnswered)

      if (!allAnswered) {

          if (!showPopup)  setShowPopup(true);
      
        } else {

        const score = answers.reduce((acc, curr, ind, arr) => {

            return curr ? acc + 1 : acc;

        }, 0);

        const body = {
            score: score,
            time: timeTaken,
            category: categoryName,
            difficulty: difficulty
        }

        const config = {
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const response = await axios.post('/quiz', body, config);
        console.log(response);

        if (response.data.message === "Results logged") {

          history.push('/profile');

        } else if (response.data.message === "not logged-in"){

          history.push('/')
        }
    }
  }

    useEffect(() => {

      getAndPrepareQuiz()

    }, [sessionToken])
  // }, [sessionToken, tokenChanged])  causes a loop because session token not updating?

      // console.log(sessionToken)
      // console.log(questions)
  
      if (noResults) {
        return <Redirect to = "/error" / >
      } 
        return (
          <div>
            <h1>Quiz Page</h1>
            {isLoading ? <p>...loading</p> : 
            <div>
            <h2>Category:{categoryName} </h2>
            <h2>Difficulty:{difficulty}</h2>  
            <p>Timer:<Timer getTimeTaken={getTimeTaken}/></p>
              </div>
            }
                <form onSubmit={formHandler}>
                    {questions.map((question, questionInd) => {
                        return (
                                <div key={questionInd} >
                                    <p> {question.question} </p>
                                    {question.answers.map((answer, answerInd) => {
                                        return(
                                            <div key={answerInd}>
                                                <label htmlFor={question.number}>{answer.answer}</label>
                                                <input type="radio" name={question.number} value={answer.correct} onChange={(event) => onRadioChange(answerInd, questionInd, event)}/>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })
                    }
                    <input type="submit" value="Submit" />
                </form>  
                {showPopup ? <Popup closePopup={togglePopup}/> : null}          
            </div>
        )
}

export default Quiz
