
import paho.mqtt.client as mqtt
from uuid import uuid4

from database import registrar_mensagem


BROKER = "broker.emqx.io"
PORTA = 1883
TOPICO = "agrosmart/fiap/gs2026/sensores"


def ao_conectar(cliente, userdata, flags, motivo, properties):
    if motivo.is_failure:
        print("Falha ao conectar ao MQTT:", motivo)
        return

    print("Conectado ao MQTT!")

    cliente.subscribe(TOPICO)
    print("Inscrito no tópico:", TOPICO)


def ao_receber(cliente, userdata, mensagem):
    print("Mensagem MQTT recebida!")

    try:
        valido = registrar_mensagem(
            mensagem.topic,
            mensagem.payload
        )

        if valido:
            print("Leitura salva no banco de dados!")
        else:
            print("Leitura inválida, salva apenas na RAW.")

    except Exception as erro:
        print("Erro ao armazenar leitura:", erro)


def iniciar_mqtt():
    cliente = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"agrosmart-backend-{uuid4().hex[:8]}"
    )

    cliente.on_connect = ao_conectar
    cliente.on_message = ao_receber

    cliente.connect_async(BROKER, PORTA, 60)
    cliente.loop_start()

    return cliente
