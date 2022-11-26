import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Table.css";
import {BallTriangle} from "react-loader-spinner";
function Table() {
  const [symbol, setSymbol] = useState([]);
  const [mapData, setMapData] = useState([]);

  const socket = new WebSocket("wss://production-esocket.delta.exchange");

  let newArr = [];
  let responseData = [];
  useEffect(() => {
    axios
      .get(`https://api.delta.exchange/v2/products`)
      .then((response) => {
        console.log(response.data);
        responseData = [...new Set(response.data.result)];
        response.data.result.forEach((element) => {
          newArr.push(element.symbol);
        });
        newArr = [...new Set(newArr)];
        setSymbol([...newArr]);
      })
      .catch((err) => console.log(err));
    console.log(newArr);

    function unsubscribe() {
      socket.onopen = function (e) {
        let data = {
          type: "subscribe",
          payload: {
            channels: [
              {
                name: "v2/ticker",
                symbols: newArr,
              },
            ],
          },
        };

        socket.send(JSON.stringify(data));
      };
      let counter = 0;

      socket.onmessage = function (event) {
        console.log(counter);
        let eventData = JSON.parse(event.data);
        if (counter > newArr.length) {
          socket.close();
        }
        counter++;
        for (let i = 0; i < responseData.length; i++) {
          if (responseData[i].symbol === eventData.symbol) {
            responseData[i] = {
              ...responseData[i],
              mark_price: eventData.mark_price,
            };
          }
        }
        setMapData([...responseData]);
        console.log(eventData);
      };
      socket.onclose = function () {
        console.log("Socket closed");
      };
      socket.onerror = function (event) {
          console.log(event);
      }
    }
    unsubscribe();
  }, []);

  return (
    <>
      {!mapData[0] ? (
        <BallTriangle
          height={100}
          width={100}
          radius={5}
          color="#4fa94d"
          ariaLabel="ball-triangle-loading"
          wrapperClass={{}}
          wrapperStyle=""
          visible={true}
        />
      ) : (
        <table>
          <thead>
            <tr>
              <th className="outside-tr">Symbol</th>
              <th>Description</th>
              <th>Underlying Asset</th>
              <th>Mark Price</th>
            </tr>
          </thead>
          <tbody>
            {mapData.map(
              ({ symbol, description, underlying_asset, mark_price }) => (
                <tr key={symbol}>
                  <td className="first-clmn">{symbol}</td>
                  <td>{description}</td>
                  <td>{underlying_asset.symbol}</td>
                  <td>{mark_price}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </>
  );
}

export default Table;
