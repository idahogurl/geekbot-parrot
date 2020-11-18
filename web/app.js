import 'preact/debug';
import { render, h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import CopyToClipboard from 'react-copy-to-clipboard';
import CheckBoxList from './CheckBoxList';

/** @jsx h */

function App() {
  const [data, setData] = useState({ yesterday: [], today: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create an scoped async function in the hook
    async function getData() {
      if (loading) {
        const data = await fetch('http://localhost:3000/api');
        const { yesterday, today } = await data.json();
        setData({
          yesterday,
          today
        });
        setLoading(false);
      }
    }
    getData();
  }, [loading]);

  return (
    <Fragment>
      {!data.yesterday.length && <Fragment>Loading...</Fragment>}
      <ActivityList title="What did you do" data={data.yesterday} />
      <ActivityList title="What will you do" data={data.today} />
    </Fragment>
  );
}
// setItems(stuff);

function ActivityList({ title, data }) {
  const [selected, setSelected] = useState([]);
  const chkboxList = useRef(null);

  const handleCheckboxListChange = values => {
    setSelected(values);
  };

  if (data.length) {
    return (
      <div>
        <h2>{title}</h2>
        <CheckBoxList
          ref={chkboxList}
          defaultData={data}
          onChange={handleCheckboxListChange}
        />
        <CopyToClipboard
          text={selected.join('\n')}
          // onCopy={() => this.setState({ copied: true })}
        >
          <button>Copy</button>
        </CopyToClipboard>
      </div>
    );
  }
}

render(<App />, document.getElementById('app'));
