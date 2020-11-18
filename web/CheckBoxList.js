// Upgraded https://github.com/sonyan/react-checkbox-list
import { h } from 'preact';
import { useState } from 'preact/hooks';

/** @jsx h */

function CheckBoxList(props) {
  const [data, setData] = useState(props.defaultData);

  const handleItemChange = e => {
    const newData = [...data];
    const index = parseInt(e.target.value);
    const item = newData[index];
    newData[index] = { ...item, checked: e.target.checked };
    const selected = newData
      .map(n => {
        if (n.checked) {
          return n.label;
        }
      })
      .filter(a => a);
    setData(newData);
    if (props.onChange) {
      props.onChange(selected);
    }
  };

  // uncheck all items in the list
  const reset = () => {
    const newData = [];
    data.forEach(function(item) {
      item.checked = false;
      newData.push(item);
    });

    setData(newData);
  };

  const checkAll = () => {
    const newData = [];
    data.forEach(function(item) {
      item.checked = true;
      newData.push(item);
    });

    setData(newData);
  };

  const options = data.map((item, index) => {
    return (
      <div key={`chk-${index}`} className="checkbox">
        <label>
          <input
            type="checkbox"
            value={item.value}
            onChange={handleItemChange}
            checked={item.checked}
          />{' '}
          {item.label}
        </label>
      </div>
    );
  });

  return <div>{options}</div>;
}

export default CheckBoxList;
