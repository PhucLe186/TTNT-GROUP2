from flask import Flask, request, jsonify
import numpy as np
from node import Node, Puzzle, Distance
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

@app.route('/solve', methods=['POST'])



def solve():
    data = request.get_json()
    initial_board = data['start']
    if (Puzzle.check_Solvable(initial_board)==False):
        return jsonify({'solution': None, 'steps': 0, 'error': 'Trạng thái không giải được!'})
    heuristic = int(data.get('heuristic', 2))  # 2 là Manhattan, 1 là Misplaced
    final_board = [1, 2, 3, 4, 5, 6, 7, 8, 0]
    initial_node = Node(initial_board)
    final_node = Node(final_board)
    explored_nodes = []
    fringe = [initial_node]
    distance = Distance.distance(initial_node.get_current_state(), final_node.get_current_state(), heuristic)
    fringe[0].update_hn(distance)
    count = 1
    found = False
    goal_node_obj = None


    while fringe:
        minimum_fn_index = Puzzle.least_fn(fringe)
        current_node = fringe.pop(minimum_fn_index)
        g = current_node.get_gn() + 1
        goal_node = np.asarray(final_node.get_current_state())



        if np.array_equal(np.asarray(current_node.get_current_state()), goal_node):

            distance = Distance.distance(np.asarray(current_node.get_current_state()), goal_node, heuristic)
            explored_nodes.append(current_node)
            fringe = []
            found = True

            goal_node_obj = current_node
        elif not np.array_equal(current_node, goal_node):
            zero = np.where(np.asarray(current_node.get_current_state()) == 0)[0][0]
            count = Node.expand_node(fringe, explored_nodes, current_node, goal_node, zero, g, count, heuristic)


    if found:
        solution_path = Puzzle.get_solution_path(goal_node_obj)
        return jsonify({'solution': solution_path, 'found': True , 'steps': len(solution_path)-1})

    else:
        return jsonify({'solution': None, 'steps': 0})

if __name__ == '__main__':
    app.run(debug=True)
