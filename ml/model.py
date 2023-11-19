import torch
import torch.nn as nn
import torch.nn.functional as F


class FreqToNote(nn.Module):
    def __init__(self, window_size, hidden_layer):
        super(FreqToNote, self).__init__()

        self.window_size = window_size # 1<<12
        self.hidden_layer = hidden_layer # 100

        self.linear1 = nn.Linear(window_size, hidden_layer)
        self.activation = nn.ReLU()
        self.linear2 = nn.Linear(hidden_layer, 88)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.linear1(x)
        x = self.activation(x)
        x = self.linear2(x)
        x = self.sigmoid(x)
        return x

torch_model = FreqToNote(1 + (1<<11), 200)
torch_input = torch.randn(1, torch_model.window_size)

data = pd.read_csv('data_process/data')
out = pd.read_csv('data_process/out')

dataset = CustomDataset(data, out)

optimizer=torch.optim.Adam(model.parameters())
lossFunction=torch.nn.BCELoss()

epochs=3

batch_size = 128
for epoch in range(epochs):
    permutation = torch.randperm(dataset.size()[0])

    for input, label in range(0, dataset.size()[0], batch_size):
        optimizer.zero_grad()
        output=model(input)
        loss=lossFunction(output, label)
        print(loss)
        loss.backward()
        optimizer.step()

torch.onnx.export(
    torch_model,
    torch_input,
    "freq_predictor.onnx",
    opset_version=13,
    input_names=["input"],
    output_names=["output"]
)
