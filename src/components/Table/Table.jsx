import React, { useState, useEffect } from "react";
import axios from "axios";
import { TailSpin } from "react-loader-spinner";

import "./Table.css";

function Table() {
  const [symbol, setSymbol] = useState([]);
  const [mapData, setMapData] = useState([]);

  const socket = new WebSocket("wss://production-esocket.delta.exchange");

  let newArr = [];
  let responseData = [];

  const price = {};

  useEffect(() => {
    axios
      .get(`https://api.delta.exchange/v2/products`)
      .then((response) => {
        responseData = [...new Set(response.data.result)];
        response.data.result.forEach((element) => {
          newArr.push(element.symbol);
        });
        newArr = [...new Set(newArr)];
        setSymbol([...newArr]);
      })
      .catch((err) => console.log(err));
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
        let eventData = JSON.parse(event.data);
        if (counter > newArr.length) {
          socket.close();
        }
        counter++;
        price[eventData.symbol] = eventData.mark_price;
      };
      socket.onclose = function () {
        for (let i = 0; i < responseData.length; i++) {
          responseData[i] = {
            ...responseData[i],
            mark_price: price[responseData[i].symbol],
          };
        }
        setMapData([...responseData]);
      };
      socket.onerror = function (event) {
        console.log(event);
      };
    }
    unsubscribe();
  }, []);

  return (
    <>
      {!mapData[0] ? (
        <div className="loader">
          <span>Loading...</span>
          <TailSpin height={50} width={5000} />
        </div>
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
                  <td className="mark-price">{mark_price}</td>
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