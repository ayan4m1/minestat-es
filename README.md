# slate-md

![Package Version](https://badge.fury.io/js/slate-md.svg)

## usage

```jsx
import { serialize, deserialize } from 'slate-md';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { useMemo } from 'react';

export default function App({ defaultValue }) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([]);
  const handleChange = useCallback((value) => {
    console.dir(serialize(value));
  }, []);

  useEffect(() => {
    async function deserializeValue() {
      setValue(await deserialize(defaultValue));
    }

    deserializeValue();
  }, [defaultValue]);

  return (
    <Slate editor={editor} onChange={handleChange} value={value}>
      <Editable />
    </Slate>
  );
}
```
