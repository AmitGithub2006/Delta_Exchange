import React, { useState, useEffect } from "react";
import axios from "axios";

import "./Table.css";

function Table() {
  const [symbol, setSymbol] = useState([]);
  const [mapData, setMapData] = useState([]);

  // Creating a socket connection

  const socket = new WebSocket("wss://production-esocket.delta.exchange");

  let newArr = [];
  let responseData = [];

  const price = {};

  useEffect(() => {
    // Calling the API for Symbol, Description and Underlying asset
    axios
      .get(`https://api.delta.exchange/v2/products`)
      .then((response) => {
        responseData = [...new Set(response.data.result)];
        setMapData(responseData);
        response.data.result.forEach((element, index) => {
          newArr.push(element.symbol);
        });
        newArr = [...new Set(newArr)];
        setSymbol([...newArr]);
      })
      .catch((err) => console.log(err));
      function unsubscribe() {
        // Unsubscribing the channel
        socket.onopen = function (e) {
          let unsub = {
            type: "unsubscribe",
            payload: {
              channels: [
                {
                  name: "v2/ticker",
                  symbols: newArr,
                },
              ],
            },
          };
          socket.send(JSON.stringify(unsub));

          // Subscribing the channel
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
          let eventData = JSON.parse(event.data);
          if (counter > newArr.length) {
            socket.close();
          }
          counter++;
          price[eventData.symbol] = eventData.mark_price;
        };

        // Closing the connection
        socket.onclose = function () {
          for (let i = 0; i < responseData.length; i++) {
            responseData[i] = {
              ...responseData[i],
              mark_price: price[responseData[i].symbol],
            };
          }
          setMapData([...responseData]);
        };

        // Catching error if any
        socket.onerror = function (event) {
          console.log(event);
        };
      }
    unsubscribe();
  }, []);

  return (
    <>
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
                <td className="mark-price">
                  {mark_price === undefined
                    ? "Fetching mark price..."
                    : mark_price}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </>
  );
}
export default Table;