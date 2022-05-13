import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

//WARN: DO NOT SAVE API KEYS IN THE OUTPUT BUNDLE UNDER NORMAL CIRCUMSTANCES
//This is an exceptional circumstance, as there is no back-end service available for this test project
const API_KEY = ''; //TODO: replace this

//number to find at once
const LIMIT = 25;

//A single result box
interface ResultProps {
  index: number;
  url: string;
  title: string;
  image: string;
  width: number;
  height: number;
}

const Result = (props: ResultProps): React.ReactElement => {
  const { url, title, image, width, height } = props;

  return (
    <div className='result'>
      <a href={url} target='_blank'>
        <img src={image} width={width} height={height} />
      </a>

      <p style={{maxWidth: `${width}px`}}>{title}</p>
    </div>
  );
};

//the main app
interface AppProps {
  name: string;
}

interface ThrottleCache {
  value: string;
  handle: number;
}

const App = (props: AppProps): React.ReactElement => {
  //various hooks
  const searchRef = useRef<HTMLInputElement>(null);
  const [isEndVisible, endElement] = useVisibility(0);

  const [offset, setOffset] = useState(0);
  const [returned, setReturned] = useState([]);

  const [throttleCache, setThrottleCache] = useState<ThrottleCache>({ value: '', handle: -1 }); //used for slowing down API requests

  //effects
  useEffect(() => {
    onAtEnd(searchRef.current, offset, setOffset, setReturned);
  }, [isEndVisible]);

  //render
  return (
    <div className='page'>
      <br className='topgap' />

      <input ref={searchRef} className='search' type='text' placeholder='Giphy Search...' onChange={async evt => await onChange(searchRef.current, setOffset, setReturned, throttleCache, setThrottleCache)} />

      <div className='result-list'>
        {returned.map((props, index) => <Result key={index} {...props} />)}

        <div ref={endElement} />
      </div>
    </div>
  )
};

//DOCS: when typing into the search bar; rate-limited to prevent rapid flashing (and API flooding)
const onChange = async (inputElement: HTMLInputElement | null, setOffset: Function, setReturned: Function, throttleCache: ThrottleCache, setThrottleCache: Function) => {
  //cancel previous calls
  clearTimeout(throttleCache.handle);

  const handle = setTimeout(async () => {
    //guard
    if (inputElement == null || inputElement.value == throttleCache.value) {
      return;
    }

    setOffset(0);
    setReturned([]); //BUGFIX: clear existing results
    setThrottleCache({ value: inputElement.value, handle: -1 });

    //build the request
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${inputElement?.value}&limit=${LIMIT}&offset=0&rating=g&lang=en`;
    const results = await axios.get(url);

    //on success
    if (results.status == 200) {
      //save only relevant data
      setReturned(results.data.data.map((img: any) => ({
          url: img.url,
          title: img.title,
          image: img.images.fixed_width.url,
          width: img.images.fixed_width.width,
          height: img.images.fixed_width.height
        })
      ));
    }
  }, 200); //setTimeout

  //cache the timedout function
  setThrottleCache({ handle: handle });
};

//DOCS: when scrolling down the page
const onAtEnd = async (inputElement: HTMLInputElement | null, offset: number, setOffset: Function, setReturned: Function) => {
  //guard
  if (inputElement == null) {
    return;
  }

  //update the offset (increment to the next "page")
  const newOffset = offset + LIMIT;
  setOffset(newOffset);

  //build the request
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${inputElement?.value}&limit=${LIMIT}&offset=${newOffset}&rating=g&lang=en`;
  const results = await axios.get(url);

  //on success
  if (results.status == 200) {
    //save (append) only relevant data
    setReturned((prev: any) => [...prev, ...results.data.data.map((img: any) => ({
        url: img.url,
        title: img.title,
        image: img.images.fixed_width.url,
        width: img.images.fixed_width.width,
        height: img.images.fixed_width.height
      })
    )]);
  }
};

//utility functions - a custom hook
//modified from https://stackoverflow.com/questions/45514676/react-check-if-element-is-visible-in-dom
function useVisibility<Element extends HTMLElement>(offset = 0): [Boolean, React.RefObject<HTMLDivElement>] {
  const [isVisible, setIsVisible] = useState(false);
  const currentElement = useRef<HTMLDivElement>(null);

  const innerScroll = () => {
    if (!currentElement.current) {
      setIsVisible(false);
      return;
    }

    const top = currentElement.current.getBoundingClientRect().top;
    setIsVisible(top + offset >= 0 && top - offset <= window.innerHeight);
  }

  useEffect(() => {
    document.addEventListener('scroll', innerScroll, true);
    return () => document.removeEventListener('scroll', innerScroll, true);
  }, []);

  return [isVisible, currentElement];
}

export default App;
