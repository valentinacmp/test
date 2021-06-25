import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Button, Text, View, FlatList, SectionList, Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Icon } from 'react-native-elements';
import base64 from 'react-native-base64';

export default class HomeScreen extends React.Component {

    constructor(props) {  
        super(props);
        this.state = {
            devices: [],
            count: 0,
            isConnected: false,
            isLoading: false,
            scannedDevices: false,
            isDeviceConnected: false
        };
        this.manager = new BleManager();
    }  

    scanAndConnect() {
        this.manager.startDeviceScan(null, null, async (error, device) => {
            this.setState({ devices: [...this.state.devices, device] });

            if (error) {
                // Handle error (scanning will be stopped automatically)
                console.log('error 1 AQUI',error.message)
                return
            }

            this.state.count++

            if(this.state.count > 20) {
                this.manager.stopDeviceScan();
                console.log('stopped');

                let devicesFilter = this.state.devices.filter( (ele, ind) => ind === this.state.devices.findIndex( elem => elem.id === ele.id ));
                this.setState({devices: devicesFilter, scannedDevices: true, isLoading: false});
                console.log('Scanned Devices', this.state.devices);
            }

        });
    }

    connectDevice(device){
        device.connect().then((item) => {
            console.log("Connected to ->", item.id)
            console.log("Discovering services and characteristics", item.discoverAllServicesAndCharacteristics());
            this.setState({isDeviceConnected: true});
            return item.discoverAllServicesAndCharacteristics();
        }).then((item) => {
            console.log('Do work on device with services and characteristics', item.id);
            return this.setupNotifications(item);
            // item.writeCharacteristicWithResponseForService('12ab', '34cd', 'aGVsbG8gbWlzcyB0YXBweQ==')
            // .then((characteristic) => {
            //     console.log('characteristic',characteristic.value);
            //     return 
            // })
        }).catch((error) => {
            console.log('error connect: ', error.message);
        })
    }

    disconnetDevice(device){
        this.setState({isDeviceConnected: false});
        console.log('disconnected', device.id);
        this.manager.cancelDeviceConnection(device.id).then(res =>{
            console.log('cancel device connection');
        }).catch((error) => {
            console.log('error connect: ', error.message);
        })
    }

    base64ToHex(text) {
        return base64.encode(text);
    }
      

    setupNotifications(device) {
        console.log(this.manager.servicesForDevice(device.id));
    }

    getDevices = () => {
        this.scanAndConnect();
        this.setState({isLoading: true});
        console.log('Scanning...');
    }

    isNull = (item) =>{
        if(item === null){
            return 'N/A';
        } else {
            return item
        }
    }

    componentDidMount() {
        this.manager.onStateChange((state) => {
            console.log('State ->',state);
            if (state === 'PoweredOn') {
                this.setState({ isConnected: true });
                console.log(this.state.isConnected);
            } else {
                this.setState({ isConnected: false });
                console.log(this.state.isConnected);
            }
        }, true);

        if (Platform.OS === 'android' && Platform.Version >= 29) {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
                if (result) {
                  console.log("Permission is OK", result);
                } else {
                  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
                    if (result) {
                      console.log("User accept");
                    } else {
                      console.log("User refuse");
                    }
                  });
                }
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isConnected !== this.state.isConnected) {
          console.log('is connected state has changed.')
        }
      }

    render() {
        return ( 
            <View style={styles.container}>
                    { this.state.isConnected ? 
                        !this.state.isLoading && !this.state.scannedDevices ?
                        <View style={styles.blueTurnOff}>
                            <Icon name='bluetooth' size={200} color='#00aced' />
                            <Text style={styles.text}>Bluetooth turn on! Click the button to scan devices.</Text>
                            <Button
                                title='Scan'
                                onPress={() => {
                                    this.getDevices();
                                }}
                            />
                        </View> : 
                         !this.state.scannedDevices ? 

                         <View style={[styles.loader, styles.horizontal]}>
                            <ActivityIndicator size={150} color="#69aced" />
                        </View> : 
                           
                            <FlatList
                                style={styles.container}
                                data={this.state.devices}
                                renderItem={({ item }) => 
                                    <View  style={styles.deviceList}>
                                        <Icon style={styles.iconBlue} name='bluetooth' size={30} color='#00aced' />
                                        <View>
                                            <Text style={styles.rowName}>Device Name: {this.isNull(item.name)}</Text>

                                            { !this.state.isDeviceConnected ? <Button title = 'CONNECT' onPress={() => {this.connectDevice(item);}}/> : <Button title = 'DISCONNECT' onPress={() => {this.disconnetDevice(item);}}/> }

                                            <Text style={styles.row}> <Text style={styles.bold}>Connectable:</Text> {this.isNull(item.isConnectable) === 'N/A' ? 'Yes' : this.isNull(item.isConnectable)}</Text>
                                            <Text style={styles.row}> <Text style={styles.bold}>ID:</Text> {item.id}</Text>
                                            <Text style={styles.row}> <Text style={styles.bold}>MTU:</Text> {this.isNull(item.mtu) === 'N/A' ? this.isNull(item.mtu): `${item.mtu} bytes`}</Text>
                                            <Text style={styles.row}> <Text style={styles.bold}>Services:</Text> {this.isNull(item.serviceData)}</Text>
                                            <Text style={styles.row}> <Text style={styles.bold}>Manufacturer Data:</Text> {this.base64ToHex(this.isNull(item.manufacturerData))}</Text>
                                            <Text style={styles.row}> <Text style={styles.bold}>Tx Power:</Text> {this.isNull(item.txPowerLevel) === 'N/A' ? this.isNull(item.txPowerLevel): `${item.txPowerLevel} dBm`}</Text>
                                        </View>
                                        
                                    </View>

                                }
                                keyExtractor={(item) => item.id}
                            />
                        
                     :
                     <View style={styles.blueTurnOff}>
                         <Icon name='bluetooth-disabled' size={200} color='#00aced' />
                         <Text style={styles.text}>Please turn on Bluetooth on your device to continue.</Text>
                     </View> }
            </View>
        );
    }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  subHeader: {
    height: 35,
    backgroundColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  text: {
    fontSize: 20,
    padding: 5,
    textAlign: 'center',
    width: 300
  },
  rowName: {
    fontSize: 20,
    paddingBottom: 5,
  },
  row: {
    backgroundColor: '#f2f4f5',
    padding: 5,
    width: 320
  },
  blueTurnOff: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loader: {
    flex: 1,
    justifyContent: "center"
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    height: 300
  },
  deviceList: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between'
  },
  bold: {
      fontWeight: 'bold'
  },
  iconBlue: {
    borderWidth:1,
    borderColor:'rgba(0,0,0,0.2)',
    alignItems:'center',
    justifyContent:'center',
    width: 80,
    height: 80,
    backgroundColor:'#fafafa',
    borderRadius: 50,
    margin: 5,
    paddingTop: 5,
  }
});
