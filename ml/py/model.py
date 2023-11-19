import torch
import torch.nn as nn
import torch.nn.functional as F


class FreqToNote(nn.Module):
    def __init__(self, window_size, out_range, hidden_layer):
        super(FreqToNote, self).__init__()

        self.window_size = window_size # 1<<12
        self.out_range = out_range # [31, 31+12*3+5]
        self.hidden_layer = hidden_layer # 100

        self.linear1 = nn.Linear(window_size, hidden_layer)
        self.activation = nn.ReLU()
        self.linear2 = nn.Linear(hidden_layer, out_range[1] - out_range[0] + 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.linear1(x)
        x = self.activation(x)
        x = self.linear2(x)
        x = self.sigmoid(x)
        x = F.pad(x, (self.out_range[0], 88-self.out_range[1]))
        return x

torch_model = FreqToNote(1<<13, [31, 31+12*3+5], 200)
torch_input = torch.randn(1, 1<<13)
print(torch_model.forward(torch_input))

onnx_program = torch.onnx.dynamo_export(torch_model, torch_input)
onnx_program.save("freq_predictor.onnx")