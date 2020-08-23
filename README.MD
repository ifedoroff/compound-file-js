This is an implementation of [Compound Binary File v.3](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/53989ce4-7b05-4f8d-829b-d08d6148375b) \
Allows reading existing files, creation of the/write operation

#### **Usage**

To parse existing Compound Binary File:

```js

const {CompoundFile} = require('compound-binary-file-js');

const reader = new FileReader(); 
reader.onload = () => { 
    const arrayBuffer = reader.result; 
    const cfb = CompoundFile.fromUint8Array(new Uint8Array(arrayBuffer));
    const rootStorage = cfb.getRootStorage();
    const subStorages = rootStorage.storages();
    const subStreams = rootStorage.streams();
    // etc.
};

reader.readAsArrayBuffer(input.files[0]);
```

Or alternatively you may use the following syntax if you read file as number[]:
 	
 	var cfb = CompoundFile.fromUint8Array([...arrayOfBytes]);
 	
To create new Compound File: 

```js
const {CompoundFile} = require('compound-binary-file-js');

const cfb = CompoundFile.empty();
const storage1 = cfb.getRootStorage().addStorage('storage1');
const stream1 = storage1.addStream('stream1', [1,2,3,4]);
const fileBytes = cfb.asBytes();
```
