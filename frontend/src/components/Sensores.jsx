
import { useState, useEffect } from "react";
import mqtt from "mqtt";

export function useSensores() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const cliente = mqtt.connect(
      "wss://broker.emqx.io:8084/mqtt"
    );

    const topico = "agrosmart/gs2026/lucas/sensores";

    cliente.on("connect", () => {
      cliente.subscribe(topico);
    });

    cliente.on("message", (topicoRecebido, mensagem) => {
      if (topicoRecebido === topico) {
        try {
          const dadosRecebidos = JSON.parse(
            mensagem.toString()
          );

          setDados(dadosRecebidos);
        } catch (erro) {
          console.error("Erro ao ler dados MQTT:", erro);
        }
      }
    });

    return () => {
      cliente.end();
    };
  }, []);

  return dados;
}



